import chalk from 'chalk';
import ora from 'ora';
import SalesforceConnector from './salesforce.js';
import { TuiHandler } from './tui/tui-handler.js';

class TerminalUI {
  constructor() {
    this.sf = new SalesforceConnector();
    this.tuiHandler = new TuiHandler(this.sf);
  }

  async start() {
    console.log(chalk.blue.bold('🚀 Salesforce Org Browser'));
    console.log(chalk.gray('Connecting to your Salesforce org...\n'));

    const spinner = ora('Connecting to Salesforce...').start();
    
    try {
      await this.sf.connect();
      spinner.succeed('Connected to Salesforce!');
      
      const connInfo = this.sf.getConnectionInfo();
      if (connInfo) {
        console.log(chalk.green(`✓ Connected as: ${connInfo.username}`));
        console.log(chalk.green(`✓ Org ID: ${connInfo.orgId}`));
        console.log(chalk.green(`✓ Instance: ${connInfo.instanceUrl}\n`));
      }

      await this.tuiHandler.showMainMenu();
    } catch (error) {
      spinner.fail('Connection failed');
      console.error(chalk.red(`Error: ${error.message}`));
      console.log(chalk.yellow('\nPlease check your credentials or run:'));
      console.log(chalk.yellow('sf org login web'));
      process.exit(1);
    }
  }
}

/* Start the application. */
const tui = new TerminalUI();
tui.start();
