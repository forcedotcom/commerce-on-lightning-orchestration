/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const TOPIC = 'scratchorg';
const messages = Messages.loadMessages('commerce-orchestration', TOPIC);

export const scratchOrgFlags = {
  'scratch-org-admin-username': flags.string({
    char: 'u',
    default: 'demo@1commerce.com',
    description: messages.getMessage('createFlags.scratchOrgAdminUsernameDescription'),
  }),
  'scratch-org-store-name': flags.string({
    char: 's',
    default: '1commerce',
    description: messages.getMessage('createFlags.scratchOrgStoreNameDescription'),
  }),
  'scratch-org-number': flags.number({
    char: 'n',
    default: 0,
    description: messages.getMessage('createFlags.scratchOrgStoreNumberDescription'),
  }),
  'is-b2c-lite-access-perm-needed': flags.boolean({
    char: 'p',
    default: false,
    description: messages.getMessage('createFlags.isB2cLiteAccessPermNeededDescription'),
  }),
  'scratch-org-alias': flags.string({
    char: 'g',
    default: 'devhub',
    description: messages.getMessage('createFlags.scratchOrgAliasDescription'),
  }),
  type: flags.string({
    char: 't',
    default: 'b2c',
    description: 'b2b or b2c',
  }),
};
