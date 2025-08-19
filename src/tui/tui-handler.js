import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { METADATA_TYPES, TUI_MENU_OPTIONS, getMetadataTypeByTuiValue, getListMethod, getDetailMethod } from '../config/metadata-types.js';

export class TuiHandler {
  constructor(sf) {
    this.sf = sf;
  }

  async showMainMenu() {
    console.clear();
    console.log(chalk.blue.bold('🚀 Salesforce Org Browser'));
    console.log(chalk.gray('─'.repeat(50)));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to explore?',
        choices: [
          ...TUI_MENU_OPTIONS,
          new inquirer.Separator(),
          { name: '🔍 Search Metadata', value: 'search' },
          { name: '📤 Export Component', value: 'export' },
          new inquirer.Separator(),
          { name: '🚪 Exit', value: 'exit' }
        ]
      }
    ]);

    switch (action) {
      case 'exit':
        console.log(chalk.green('👋 Goodbye!'));
        process.exit(0);
        break;
      case 'search':
        await this.searchMetadata();
        break;
      case 'export':
        await this.exportComponent();
        break;
      default:
        await this.exploreMetadataType(action);
        break;
    }
  }

  async exploreMetadataType(metadataTypeValue) {
    const metadataType = getMetadataTypeByTuiValue(metadataTypeValue);
    if (!metadataType) {
      console.log(chalk.red('Invalid metadata type'));
      await this.showMainMenu();
      return;
    }

    const spinner = ora(`Loading ${metadataType.displayName}...`).start();
    
    try {
      const methodName = getListMethod(metadataType);
      if (!methodName) {
        throw new Error(`No list method found for metadata type: ${metadataType.exportType}`);
      }
      
      const items = await this.sf[methodName]();
      
      if (items.length === 0) {
        spinner.succeed(`Found 0 ${metadataType.displayName.toLowerCase()}`);
        console.log(chalk.yellow(`\n📭 No ${metadataType.displayName.toLowerCase()} found in this org.`));
        console.log(chalk.gray('This could mean:'));
        console.log(chalk.gray('• No items of this type exist in your org'));
        console.log(chalk.gray('• You don\'t have permission to view this metadata'));
        console.log(chalk.gray('• The metadata type is not available in your org edition'));
        
        await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Press Enter to continue',
            choices: [
              { name: '🔙 Return to main menu', value: 'back' }
            ]
          }
        ]);

        await this.showMainMenu();
        return;
      }

      spinner.succeed(`Found ${items.length} ${metadataType.displayName.toLowerCase()}`);

      // Sort items alphabetically by fullName
      const sortedItems = items.sort((a, b) => a.fullName.localeCompare(b.fullName));

      const choices = sortedItems.map(item => ({
        name: item.fullName,
        value: item.fullName
      }));

      const { selectedItem } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedItem',
          message: `Select a ${metadataType.displayName.slice(0, -1).toLowerCase()} to explore:`,
          choices: [
            ...choices,
            new inquirer.Separator(),
            { name: '🔍 Search in this list', value: 'search' },
            { name: '🔙 Back to main menu', value: 'back' }
          ]
        }
      ]);

      if (selectedItem === 'back') {
        await this.showMainMenu();
        return;
      } else if (selectedItem === 'search') {
        await this.searchInMetadataType(metadataType, sortedItems);
        return;
      }

      await this.showMetadataDetails(metadataType, selectedItem);
    } catch (error) {
      spinner.fail(`Failed to load ${metadataType.displayName}`);
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      console.log(chalk.gray('This could be due to:'));
      console.log(chalk.gray('• Network connectivity issues'));
      console.log(chalk.gray('• Invalid org credentials'));
      console.log(chalk.gray('• Insufficient permissions'));
      console.log(chalk.gray('• API rate limiting'));
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '🔙 Return to main menu', value: 'back' },
            { name: '🔄 Try again', value: 'retry' }
          ]
        }
      ]);

      if (action === 'retry') {
        await this.exploreMetadataType(metadataTypeValue);
      } else {
        await this.showMainMenu();
      }
    }
  }

  async showMetadataDetails(metadataType, itemName) {
    const spinner = ora(`Loading ${itemName} details...`).start();
    
    try {
      const methodName = getDetailMethod(metadataType);
      if (!methodName) {
        throw new Error(`No detail method found for metadata type: ${metadataType.exportType}`);
      }
      
      const item = await this.sf[methodName](itemName);
      spinner.succeed(`Loaded ${itemName}`);

      if (!item) {
        spinner.fail(`Details not found for ${itemName}`);
        console.log(chalk.yellow(`\n📭 ${metadataType.displayName.slice(0, -1)} details not found.`));
        console.log(chalk.gray('This could mean:'));
        console.log(chalk.gray('• The item was deleted or renamed'));
        console.log(chalk.gray('• You don\'t have permission to view this item'));
        console.log(chalk.gray('• The item is not available in your org edition'));
        
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: `🔙 Back to ${metadataType.displayName}`, value: 'back' },
              { name: '🏠 Main Menu', value: 'main' }
            ]
          }
        ]);

        if (action === 'back') {
          await this.exploreMetadataType(metadataType.tuiValue);
        } else {
          await this.showMainMenu();
        }
        return;
      }

      console.log(chalk.blue.bold(`\n${metadataType.icon} ${itemName}`));
      console.log(chalk.gray('─'.repeat(50)));

      /* Display common properties. */
      const table = new Table({
        head: [chalk.cyan('Property'), chalk.cyan('Value')],
        colWidths: [20, 30]
      });

      if (item.label) table.push(['Label', item.label]);
      if (item.type) table.push(['Type', item.type]);
      if (item.masterLabel) table.push(['Master Label', item.masterLabel]);
      if (item.description) table.push(['Description', item.description]);
      if (item.active !== undefined) table.push(['Active', item.active ? 'Yes' : 'No']);

      console.log(table.toString());

      /* Display specific properties based on metadata type. */
      this.displaySpecificProperties(metadataType, item);

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: `📤 Export ${metadataType.displayName.slice(0, -1)}`, value: 'export' },
            { name: `🔙 Back to ${metadataType.displayName}`, value: 'back' },
            { name: '🏠 Main Menu', value: 'main' }
          ]
        }
      ]);

      switch (action) {
        case 'export':
          await this.exportMetadata(metadataType.exportType, itemName);
          break;
        case 'back':
          await this.exploreMetadataType(metadataType.tuiValue);
          break;
        case 'main':
          await this.showMainMenu();
          break;
      }
    } catch (error) {
      spinner.fail(`Failed to load ${metadataType.displayName.slice(0, -1)} details`);
      console.error(chalk.red(error.message));
      await this.showMainMenu();
    }
  }

  displaySpecificProperties(metadataType, item) {
    switch (metadataType.exportType) {
      case 'CustomObject':
        if (item.fields && item.fields.length > 0) {
          console.log(chalk.blue.bold(`\n📋 Fields (${item.fields.length}):`));
          item.fields.slice(0, 10).forEach((field, index) => {
            console.log(`  ${index + 1}. ${field.fullName || field.name}`);
          });
          if (item.fields.length > 10) {
            console.log(chalk.gray(`  ... and ${item.fields.length - 10} more fields`));
          }
        }
        break;
      case 'Layout':
        if (item.layoutSections && item.layoutSections.length > 0) {
          console.log(chalk.blue.bold(`\n📋 Sections (${item.layoutSections.length}):`));
          item.layoutSections.forEach((section, index) => {
            console.log(`  ${index + 1}. ${section.label || 'Unnamed Section'}`);
          });
        }
        break;
      case 'FlexiPage':
        if (item.flexiPageRegions && item.flexiPageRegions.length > 0) {
          console.log(chalk.blue.bold(`\n📋 Regions (${item.flexiPageRegions.length}):`));
          item.flexiPageRegions.forEach((region, index) => {
            console.log(`  ${index + 1}. ${region.name || 'Unnamed Region'}`);
          });
        }
        break;
      case 'ValidationRule':
        if (item.errorConditionFormula) {
          console.log(chalk.blue.bold('\n🔍 Error Condition Formula:'));
          console.log(chalk.gray(item.errorConditionFormula));
        }
        break;
      case 'Flow':
        if (item.processType) {
          console.log(chalk.blue.bold('\n🌊 Flow Properties:'));
          console.log(chalk.cyan('Process Type:'), item.processType);
          console.log(chalk.cyan('Status:'), item.status || 'N/A');
        }
        break;
      case 'CustomTab':
        if (item.sObjectName) {
          console.log(chalk.blue.bold('\n📑 Tab Properties:'));
          console.log(chalk.cyan('SObject:'), item.sObjectName);
          console.log(chalk.cyan('Tab Style:'), item.tabStyle || 'N/A');
        }
        break;
      case 'QuickAction':
        if (item.type) {
          console.log(chalk.blue.bold('\n⚡ Quick Action Properties:'));
          console.log(chalk.cyan('Type:'), item.type);
          console.log(chalk.cyan('Target Object:'), item.targetObject || 'N/A');
        }
        break;
      case 'PermissionSet':
        if (item.description) {
          console.log(chalk.blue.bold('\n🔐 Permission Set Properties:'));
          console.log(chalk.cyan('Description:'), item.description);
          console.log(chalk.cyan('License:'), item.license || 'N/A');
        }
        break;
      case 'CustomMetadata':
        if (item.label) {
          console.log(chalk.blue.bold('\n📊 Custom Metadata Properties:'));
          console.log(chalk.cyan('Label:'), item.label);
          console.log(chalk.cyan('Type:'), item.type || 'N/A');
        }
        break;
      case 'CustomApplication':
        if (item.formFactors) {
          console.log(chalk.blue.bold('\n📱 Application Properties:'));
          console.log(chalk.cyan('Form Factors:'), item.formFactors.join(', ') || 'N/A');
          console.log(chalk.cyan('Theme:'), item.theme || 'N/A');
        }
        break;
      case 'CustomLabel':
        if (item.language) {
          console.log(chalk.blue.bold('\n🏷️ Label Properties:'));
          console.log(chalk.cyan('Language:'), item.language);
          console.log(chalk.cyan('Protected:'), item.protected ? 'Yes' : 'No');
        }
        break;
      case 'Report':
        if (item.reportType) {
          console.log(chalk.blue.bold('\n📈 Report Properties:'));
          console.log(chalk.cyan('Report Type:'), item.reportType);
          console.log(chalk.cyan('Format:'), item.format || 'N/A');
        }
        break;
      case 'ReportType':
        if (item.baseObject) {
          console.log(chalk.blue.bold('\n📋 Report Type Properties:'));
          console.log(chalk.cyan('Base Object:'), item.baseObject);
          console.log(chalk.cyan('Category:'), item.category || 'N/A');
        }
        break;
    }
  }

  async searchMetadata() {
    const { searchTerm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchTerm',
        message: 'Enter search term:',
        validate: (input) => input.length > 0 ? true : 'Please enter a search term'
      }
    ]);

    const spinner = ora('Searching metadata...').start();
    
    try {
      /* Search across all metadata types. */
      const searchPromises = Object.values(METADATA_TYPES).map(async (metadataType) => {
        const methodName = getListMethod(metadataType);
        if (!methodName) {
          console.log(`Warning: No method found for ${metadataType.exportType}, skipping...`);
          return [];
        }
        const items = await this.sf[methodName]();
        return items.map(item => ({ ...item, type: metadataType.exportType }));
      });

      const allResults = await Promise.all(searchPromises);
      const flattenedResults = allResults.flat();
      
      const filteredResults = flattenedResults.filter(item => 
        item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Sort results alphabetically
      const sortedResults = filteredResults.sort((a, b) => a.fullName.localeCompare(b.fullName));

      spinner.succeed(`Found ${sortedResults.length} results`);

      if (sortedResults.length === 0) {
        console.log(chalk.yellow('No results found.'));
        console.log(chalk.gray('Try:'));
        console.log(chalk.gray('• Using a different search term'));
        console.log(chalk.gray('• Checking spelling'));
        
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: '🔍 Search again', value: 'search' },
              { name: '🔙 Back to main menu', value: 'back' }
            ]
          }
        ]);

        if (action === 'search') {
          await this.searchMetadata();
        } else {
          await this.showMainMenu();
        }
        return;
      }

      const choices = sortedResults.map(item => ({
        name: `${item.fullName} ${chalk.gray(`(${METADATA_TYPES[item.type].displayName})`)}`,
        value: { name: item.fullName, type: item.type }
      }));

      const { selectedItem } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedItem',
          message: `Select an item to explore (${sortedResults.length} results):`,
          choices: [
            ...choices,
            new inquirer.Separator(),
            { name: '🔍 Search again', value: 'search' },
            { name: '🔙 Back to main menu', value: 'back' }
          ]
        }
      ]);

      if (selectedItem === 'back') {
        await this.showMainMenu();
        return;
      } else if (selectedItem === 'search') {
        await this.searchMetadata();
        return;
      }

      const metadataType = METADATA_TYPES[selectedItem.type];
      await this.showMetadataDetails(metadataType, selectedItem.name);
    } catch (error) {
      spinner.fail('Search failed');
      console.error(chalk.red(error.message));
      await this.showMainMenu();
    }
  }

  async searchInMetadataType(metadataType, items) {
    const { searchTerm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchTerm',
        message: `Search in ${metadataType.displayName}:`,
        validate: (input) => input.length > 0 ? true : 'Please enter a search term'
      }
    ]);

    const filteredItems = items.filter(item => 
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredItems.length === 0) {
      console.log(chalk.yellow(`No ${metadataType.displayName.toLowerCase()} found matching "${searchTerm}"`));
      console.log(chalk.gray('Try:'));
      console.log(chalk.gray('• Using a different search term'));
      console.log(chalk.gray('• Checking spelling'));
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '🔍 Search again', value: 'search' },
            { name: `🔙 Back to ${metadataType.displayName}`, value: 'back' }
          ]
        }
      ]);

      if (action === 'search') {
        await this.searchInMetadataType(metadataType, items);
      } else {
        await this.exploreMetadataType(metadataType.tuiValue);
      }
      return;
    }

    const choices = filteredItems.map(item => ({
      name: item.fullName,
      value: item.fullName
    }));

    const { selectedItem } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedItem',
        message: `Select a ${metadataType.displayName.slice(0, -1).toLowerCase()} (${filteredItems.length} results):`,
        choices: [
          ...choices,
          new inquirer.Separator(),
          { name: '🔍 Search again', value: 'search' },
          { name: `🔙 Back to ${metadataType.displayName}`, value: 'back' }
        ]
      }
    ]);

    if (selectedItem === 'back') {
      await this.exploreMetadataType(metadataType.tuiValue);
      return;
    } else if (selectedItem === 'search') {
      await this.searchInMetadataType(metadataType, items);
      return;
    }

    await this.showMetadataDetails(metadataType, selectedItem);
  }

  async exportComponent() {
    const { metadataType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'metadataType',
        message: 'Select metadata type:',
        choices: Object.values(METADATA_TYPES).map(type => ({
          name: `${type.icon} ${type.displayName}`,
          value: type.exportType
        }))
      }
    ]);

    const selectedType = Object.values(METADATA_TYPES).find(type => type.exportType === metadataType);
    if (!selectedType) {
      throw new Error(`Invalid metadata type: ${metadataType}`);
    }
    
    const methodName = getListMethod(selectedType);
    if (!methodName) {
      throw new Error(`No method found for metadata type: ${selectedType.exportType}`);
    }
    
    try {
      const items = await this.sf[methodName]();
      
      if (items.length === 0) {
        console.log(chalk.yellow(`No ${selectedType.displayName.toLowerCase()} found.`));
        await this.showMainMenu();
        return;
      }

      const choices = items.map(item => ({
        name: item.fullName,
        value: item.fullName
      }));

      const { selectedItem } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedItem',
          message: `Select a ${selectedType.displayName.slice(0, -1).toLowerCase()} to export:`,
          choices: [
            ...choices,
            new inquirer.Separator(),
            { name: '🔙 Back to main menu', value: 'back' }
          ]
        }
      ]);

      if (selectedItem === 'back') {
        await this.showMainMenu();
        return;
      }

      await this.exportMetadata(metadataType, selectedItem);
    } catch (error) {
      console.error(chalk.red(error.message));
      await this.showMainMenu();
    }
  }

  async exportMetadata(metadataType, fullName) {
    const spinner = ora(`Exporting ${fullName}...`).start();
    
    try {
      await this.sf.exportMetadata(metadataType, fullName, process.cwd());
      spinner.succeed(`Exported ${fullName} using SFDX retrieve`);
      
      console.log(chalk.green(`✓ Successfully exported ${fullName} to force-app directory`));
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do next?',
          choices: [
            { name: '📤 Export Another', value: 'export' },
            { name: '🔙 Back to Main Menu', value: 'main' }
          ]
        }
      ]);

      switch (action) {
        case 'export':
          await this.exportComponent();
          break;
        case 'main':
          await this.showMainMenu();
          break;
      }
    } catch (error) {
      spinner.fail('Export failed');
      console.error(chalk.red(error.message));
      await this.showMainMenu();
    }
  }
}
