/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { BASE_DIR } from '../../utils/constants/properties';

const TOPIC = 'devhub';
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('commerce-orchestration', TOPIC);

export const devHubFlags = {
  configuration: flags.filepath({
    char: 'c',
    default: `${BASE_DIR}/devhub-configuration.json`,
    description: messages.getMessage('devHubFlags.configFileDescription'),
  }),
  'instance-url': flags.string({
    char: 'i',
    default: 'http://localhost:6109',
    description: messages.getMessage('devHubFlags.instanceUrlDescription'),
  }),
  'hub-org-admin-username': flags.string({
    char: 'a', // g
    default: 'ceo@mydevhub.com',
    description: messages.getMessage('devHubFlags.hubOrgAdminUsernameDescription'),
  }),
  'hub-org-admin-password': flags.string({
    char: 'p',
    default: '123456',
    description: messages.getMessage('devHubFlags.hubOrgAdminPasswordDescription'),
  }),
  'hub-org-admin-email': flags.string({
    char: 'e',
    default: `${os.userInfo().username}@salesforce.com`,
    description: messages.getMessage('devHubFlags.hubOrgAdminEmailDescription'),
  }),
  'hub-org-alias': flags.string({
    char: 'l',
    default: 'devhub',
    description: messages.getMessage('devHubFlags.hubOrgAliasDescription'),
  }),
  'hub-org-my-domain': flags.string({
    char: 'd',
    default: 'devhub',
    description: messages.getMessage('devHubFlags.hubOrgMyDomainDescription'),
  }),
  'api-version': flags.string({
    char: 'v',
    default: '52.0',
    description: messages.getMessage('devHubFlags.apiVersionDescription'),
  }),
  'server-cert': flags.filepath({
    char: 'F',
    default: BASE_DIR + '/.certs/server.crt',
    description: 'Server Cert file',
  }),
  'use-jwt': flags.boolean({
    char: 'J',
    default: false,
    description: 'Use JWT to auth',
  }),
  'client-id': flags.string({
    char: 'i',
    default: undefined,
    description: 'Client Id for auth:web:login',
  }),
};
