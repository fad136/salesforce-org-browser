/* Centralized metadata type configuration. */

export const METADATA_TYPES = {
  CustomObject: {
    displayName: 'Objects',
    icon: '📋',
    description: 'Custom and standard objects',
    exportType: 'CustomObject',
    tuiValue: 'objects',
    listMethod: 'getObjects',
    detailMethod: 'getObjectDetails'
  },
  Layout: {
    displayName: 'Layouts',
    icon: '🎨',
    description: 'Page layouts',
    exportType: 'Layout',
    tuiValue: 'layouts',
    listMethod: 'getLayouts',
    detailMethod: 'getLayoutDetails'
  },
  FlexiPage: {
    displayName: 'FlexiPages',
    icon: '⚡',
    description: 'Lightning page layouts and flexipages',
    exportType: 'FlexiPage',
    tuiValue: 'flexipages',
    listMethod: 'getFlexiPages',
    detailMethod: 'getFlexiPageDetails'
  },
  ValidationRule: {
    displayName: 'Validation Rules',
    icon: '✅',
    description: 'Field and object validation rules',
    exportType: 'ValidationRule',
    tuiValue: 'validation-rules',
    listMethod: 'getValidationRules',
    detailMethod: 'getValidationRuleDetails'
  },
  Flow: {
    displayName: 'Flows',
    icon: '🌊',
    description: 'Flow automation processes',
    exportType: 'Flow',
    tuiValue: 'flows',
    listMethod: 'getFlows',
    detailMethod: 'getFlowDetails'
  },
  CustomTab: {
    displayName: 'Tabs',
    icon: '📑',
    description: 'Custom tabs and standard tabs',
    exportType: 'CustomTab',
    tuiValue: 'tabs',
    listMethod: 'getTabs',
    detailMethod: 'getTabDetails'
  },
  QuickAction: {
    displayName: 'Quick Actions',
    icon: '⚡',
    description: 'Quick actions and global actions',
    exportType: 'QuickAction',
    tuiValue: 'quick-actions',
    listMethod: 'getQuickActions',
    detailMethod: 'getQuickActionDetails'
  },
  PermissionSet: {
    displayName: 'Permission Sets',
    icon: '🔐',
    description: 'Permission sets and profiles',
    exportType: 'PermissionSet',
    tuiValue: 'permission-sets',
    listMethod: 'getPermissionSets',
    detailMethod: 'getPermissionSetDetails'
  },
  CustomMetadata: {
    displayName: 'Custom Metadata',
    icon: '📊',
    description: 'Custom metadata types and records',
    exportType: 'CustomMetadata',
    tuiValue: 'custom-metadata',
    listMethod: 'getCustomMetadata',
    detailMethod: 'getCustomMetadataDetails'
  },
  CustomApplication: {
    displayName: 'Applications',
    icon: '📱',
    description: 'Lightning applications',
    exportType: 'CustomApplication',
    tuiValue: 'applications',
    listMethod: 'getApplications',
    detailMethod: 'getApplicationDetails'
  },
  CustomLabel: {
    displayName: 'Labels',
    icon: '🏷️',
    description: 'Custom labels',
    exportType: 'CustomLabel',
    tuiValue: 'labels',
    listMethod: 'getLabels',
    detailMethod: 'getLabelDetails'
  },
  Report: {
    displayName: 'Reports',
    icon: '📈',
    description: 'Reports and dashboards',
    exportType: 'Report',
    tuiValue: 'reports',
    listMethod: 'getReports',
    detailMethod: 'getReportDetails'
  },
  ReportType: {
    displayName: 'Report Types',
    icon: '📋',
    description: 'Report types and templates',
    exportType: 'ReportType',
    tuiValue: 'report-types',
    listMethod: 'getReportTypes',
    detailMethod: 'getReportTypeDetails'
  }
};

/* Helper functions. */
export function getMetadataTypeByKey(key) {
  return METADATA_TYPES[key];
}

export function getMetadataTypeByTuiValue(value) {
  return Object.values(METADATA_TYPES).find(type => type.tuiValue === value);
}

export function getAllMetadataTypes() {
  return Object.values(METADATA_TYPES);
}

export function getMetadataTypeKeys() {
  return Object.keys(METADATA_TYPES);
}

/* Method mapping helpers. */
export function getListMethod(metadataType) {
  return metadataType.listMethod;
}

export function getDetailMethod(metadataType) {
  return metadataType.detailMethod;
}

export function getMethodMappings() {
  const mappings = {};
  Object.values(METADATA_TYPES).forEach(type => {
    mappings[type.exportType] = {
      list: type.listMethod,
      detail: type.detailMethod
    };
  });
  return mappings;
}

/* TUI menu options. */
export const TUI_MENU_OPTIONS = Object.values(METADATA_TYPES).map(type => ({
  name: `${type.icon} ${type.displayName}`,
  value: type.tuiValue
}));
