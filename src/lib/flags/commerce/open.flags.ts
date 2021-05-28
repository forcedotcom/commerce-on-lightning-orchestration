/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags } from '@salesforce/command';
import { Messages } from '@salesforce/core';

const TOPIC = 'open';
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('commerce', TOPIC);

export const openFlags = {
  editor: flags.string({
    char: 'e',
    default: 'vi',
    description: messages.getMessage('devhubconfig.editorDescription'),
  }),
};
