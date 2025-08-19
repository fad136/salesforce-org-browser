import jsforce from 'jsforce';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

class SalesforceConnector {
  constructor() {
    this.conn = null;
    this.orgInfo = null;
  }

  async connect(workingDir = process.cwd()) {
    try {
      console.log('\n🔍 Attempting to connect to Salesforce...');
      
      console.log('📋 Checking SFDX CLI authentication...');
      if (await this.useSalesforceCLI(workingDir)) {
        return true;
      }

      throw new Error('No default org configured for this directory. Please run: sf org login web');
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async useSalesforceCLI(workingDir = process.cwd()) {
    try {
      /* Check if sf CLI is available. */
      execSync('sf --version', { stdio: 'ignore' });
      
      /* Get default org info for the specified directory. */
      const orgInfo = execSync('sf org display --json', { 
        encoding: 'utf8',
        cwd: workingDir
      });
      
      /* Find the JSON part of the output (after any warnings). */
      const jsonMatch = orgInfo.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('⚠️  Could not parse org display output');
        return false;
      }
      
      const org = JSON.parse(jsonMatch[0]);
      
      if (org.result && org.result.accessToken && org.result.instanceUrl) {
        const { accessToken, instanceUrl } = org.result;
        this.conn = new jsforce.Connection({
          accessToken,
          instanceUrl
        });
        this.orgInfo = org.result;
        console.log('✅ Using SFDX default org authentication');
        return true;
      } else {
        console.log('⚠️  No default org configured for this directory');
        return false;
      }
    } catch (error) {
      console.log('⚠️  SFDX CLI not available or no default org set:', error.message);
      return false;
    }
  }



  async getMetadataList(metadataType) {
    if (!this.conn) {
      throw new Error('Not connected to Salesforce');
    }

    try {
      const result = await this.conn.metadata.list([{ type: metadataType }]);
      return result || [];
    } catch (error) {
      console.error(`Error fetching ${metadataType}:`, error.message);
      return [];
    }
  }

  async getMetadata(metadataType, fullNames) {
    if (!this.conn) {
      throw new Error('Not connected to Salesforce');
    }

    try {
      const result = await this.conn.metadata.read(metadataType, fullNames);
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error(`Error reading ${metadataType}:`, error.message);
      return [];
    }
  }

  async getObjects() {
    const objects = await this.getMetadataList('CustomObject');
    return objects;
  }

  async getObjectDetails(objectName) {
    try {
      const [object] = await this.getMetadata('CustomObject', [objectName]);
      return object;
    } catch (error) {
      console.error(`Error fetching object ${objectName}:`, error.message);
      return null;
    }
  }

  async getLayouts() {
    return await this.getMetadataList('Layout');
  }

  async getLayoutDetails(layoutName) {
    try {
      const [layout] = await this.getMetadata('Layout', [layoutName]);
      return layout;
    } catch (error) {
      console.error(`Error fetching layout ${layoutName}:`, error.message);
      return null;
    }
  }

  async getFlexiPages() {
    return await this.getMetadataList('FlexiPage');
  }

  async getFlexiPageDetails(pageName) {
    try {
      const [page] = await this.getMetadata('FlexiPage', [pageName]);
      return page;
    } catch (error) {
      console.error(`Error fetching flexi page ${pageName}:`, error.message);
      return null;
    }
  }

  async getValidationRules() {
    return await this.getMetadataList('ValidationRule');
  }

  async getFlows() {
    return await this.getMetadataList('Flow');
  }

  async getFlowDetails(flowName) {
    try {
      const [flow] = await this.getMetadata('Flow', [flowName]);
      return flow;
    } catch (error) {
      console.error(`Error fetching flow ${flowName}:`, error.message);
      return null;
    }
  }

  async getTabs() {
    return await this.getMetadataList('CustomTab');
  }

  async getTabDetails(tabName) {
    try {
      const [tab] = await this.getMetadata('CustomTab', [tabName]);
      return tab;
    } catch (error) {
      console.error(`Error fetching tab ${tabName}:`, error.message);
      return null;
    }
  }

  async getQuickActions() {
    return await this.getMetadataList('QuickAction');
  }

  async getQuickActionDetails(actionName) {
    try {
      const [action] = await this.getMetadata('QuickAction', [actionName]);
      return action;
    } catch (error) {
      console.error(`Error fetching quick action ${actionName}:`, error.message);
      return null;
    }
  }

  async getPermissionSets() {
    return await this.getMetadataList('PermissionSet');
  }

  async getPermissionSetDetails(permissionSetName) {
    try {
      const [permissionSet] = await this.getMetadata('PermissionSet', [permissionSetName]);
      return permissionSet;
    } catch (error) {
      console.error(`Error fetching permission set ${permissionSetName}:`, error.message);
      return null;
    }
  }

  async getCustomMetadata() {
    return await this.getMetadataList('CustomMetadata');
  }

  async getCustomMetadataDetails(metadataName) {
    try {
      const [metadata] = await this.getMetadata('CustomMetadata', [metadataName]);
      return metadata;
    } catch (error) {
      console.error(`Error fetching custom metadata ${metadataName}:`, error.message);
      return null;
    }
  }

  async getApplications() {
    return await this.getMetadataList('CustomApplication');
  }

  async getApplicationDetails(appName) {
    try {
      const [app] = await this.getMetadata('CustomApplication', [appName]);
      return app;
    } catch (error) {
      console.error(`Error fetching application ${appName}:`, error.message);
      return null;
    }
  }

  async getLabels() {
    return await this.getMetadataList('CustomLabel');
  }

  async getLabelDetails(labelName) {
    try {
      const [label] = await this.getMetadata('CustomLabel', [labelName]);
      return label;
    } catch (error) {
      console.error(`Error fetching label ${labelName}:`, error.message);
      return null;
    }
  }

  async getReports() {
    return await this.getMetadataList('Report');
  }

  async getReportDetails(reportName) {
    try {
      const [report] = await this.getMetadata('Report', [reportName]);
      return report;
    } catch (error) {
      console.error(`Error fetching report ${reportName}:`, error.message);
      return null;
    }
  }

  async getReportTypes() {
    return await this.getMetadataList('ReportType');
  }

  async getReportTypeDetails(reportTypeName) {
    try {
      const [reportType] = await this.getMetadata('ReportType', [reportTypeName]);
      return reportType;
    } catch (error) {
      console.error(`Error fetching report type ${reportTypeName}:`, error.message);
      return null;
    }
  }

  async exportMetadata(metadataType, metadataNames, workingDir = process.cwd()) {
    try {
      if (!this.conn) {
        throw new Error('Not connected to Salesforce');
      }

      console.log(`\n📦 Exporting ${metadataType} metadata using SFDX...`);
      
      /* Convert single name to array if needed. */
      const names = Array.isArray(metadataNames) ? metadataNames : [metadataNames];
      
      /* Use SFDX retrieve command for each metadata item. */
      for (const name of names) {
        try {
          console.log(`  📄 Exporting ${metadataType}:${name}...`);
          
          /* Run sf project retrieve start command. */
          const command = `sf project retrieve start --metadata "${metadataType}:${name}"`;
          execSync(command, { 
            cwd: workingDir,
            stdio: 'pipe',
            encoding: 'utf8'
          });
          
          console.log(`    ✅ Exported ${metadataType}:${name}`);
        } catch (error) {
          console.log(`    ❌ Failed to export ${metadataType}:${name}: ${error.message}`);
        }
      }
      
      console.log(`✅ Export completed using SFDX retrieve`);
      return true;
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  getConnectionInfo() {
    if (!this.orgInfo) {
      return null;
    }
    
    return {
      orgId: this.orgInfo.organization_id,
      userId: this.orgInfo.user_id,
      username: this.orgInfo.username,
      instanceUrl: this.conn.instanceUrl,
      orgType: this.orgInfo.org_type || 'Production'
    };
  }

  disconnect() {
    if (this.conn) {
      this.conn.logout();
      this.conn = null;
      this.orgInfo = null;
    }
  }
}

export default SalesforceConnector;
