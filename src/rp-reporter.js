const Mocha = require('mocha');

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_END,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
} = Mocha.Runner.constants;
const RPClient = require('reportportal-client');
const { testItemStatuses, logLevels, entityType } = require('./constants');
const { getBase64FileObject } = require('./reporter-utilities');

const { FAILED, SKIPPED } = testItemStatuses;
const { ERROR } = logLevels;

class ReportPortalReporter extends Mocha.reporters.Base {
  constructor(runner, config) {
    super(runner);
    this.runner = runner;
    this.client = new RPClient(config.reporterOptions);
    this.currentTestId = null;
    this.testItemIds = new Map();
    this.testIds = new Map();

    runner.on(EVENT_RUN_BEGIN, async () => {
      try {
        const launch = {
          token: config.reporterOptions.token,
          name: config.reporterOptions.launch,
          description: config.reporterOptions.description,
          attributes: config.reporterOptions.attributes,
          rerun: config.reporterOptions.rerun,
          rerunOf: config.reporterOptions.rerunOf,
          startTime: new Date().valueOf(),
        };

        const { tempId, promise } = this.client.startLaunch(launch);

        this.tempLaunchId = tempId;
        await promise;
      } catch (err) {
        console.error(`Failed to run launch. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_BEGIN, async (suite) => {
      try {
        await this.suiteStart(suite);
      } catch (err) {
        console.error(`Failed to create suite. Error: ${err}`);
      }
    });

    runner.on(EVENT_SUITE_END, async (suite) => {
      try {
        await this.suiteEnd(suite);
      } catch (err) {
        console.error(`Failed to finish suite. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_BEGIN, async (test) => {
      try {
        await this.testStart(test);
      } catch (err) {
        console.error(`Failed to create test item. Error: ${err}`);
      }
    });

    runner.on(EVENT_TEST_END, async (test) => {
      const status = test.state === 'pending' ? SKIPPED : test.state;
      try {
        if (status === FAILED) {
          this.sendLog(test);
        }
        await this.testFinished(test, { status });
      } catch (err) {
        console.error(`Failed to finish failed test item. Error: ${err}`);
      }
    });

    runner.on(EVENT_RUN_END, async () => {
      try {
        const { promise } = this.client.finishLaunch(this.tempLaunchId, {
          endTime: new Date().valueOf(),
        });
        await promise;
      } catch (err) {
        console.error(`Failed to finish run. Error: ${err}`);
      }
    });
  }

  async suiteStart(suite) {
    if (!suite.title) {
      return;
    }

    const suiteStartObj = {
      type: entityType.SUITE,
      name: suite.title.slice(0, 255).toString(),
      startTime: new Date().valueOf(),
      description: suite.description,
      attributes: [],
    };
    const parentId = !suite.root ? this.testItemIds.get(suite.parent.id) : undefined;

    const { tempId, promise } = this.client.startTestItem(
      suiteStartObj,
      this.tempLaunchId,
      parentId,
    );
    this.testItemIds.set(suite.id, tempId);
    await promise;
  }

  async suiteEnd(suite) {
    if (!suite.title) {
      return;
    }
    const suiteId = this.testItemIds.get(suite.id);
    const { promise } = this.client.finishTestItem(suiteId, {});

    await promise;
  }

  async testStart(test) {
    if (!test.title) {
      return;
    }
    const parentId = this.testItemIds.get(test.parent.id);
    const testStartObj = {
      type: entityType.STEP,
      name: test.title.slice(0, 255).toString(),
      startTime: new Date().valueOf(),
      attributes: [],
    };

    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      parentId,
    );

    this.testItemIds.set(test.id, tempId);
    await promise;
  }

  async sendLog(test) {
    const testId = this.testItemIds.get(test.id);
    const screenShotObj = getBase64FileObject(test.title);
    const message = test.err.stack;

    await this.client.sendLog(
      testId,
      {
        message,
        level: ERROR,
        time: new Date().valueOf(),
      },
      screenShotObj,
    );
  }

  async testFinished(test, finishTestObj) {
    const testId = this.testItemIds.get(test.id);
    const { promise } = this.client.finishTestItem(testId, {
      endTime: new Date().valueOf(),
      ...finishTestObj,
    });

    await promise;
  }
}

module.exports = ReportPortalReporter;