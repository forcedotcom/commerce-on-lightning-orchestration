/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import puppeteer, { Browser, Page } from 'puppeteer';
import { shellJsonSfdx } from './shell';

export class PuppeteerHoseMyOrg {
  protected scratchOrgAdminUsername: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected ux: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected options: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected msgs: any;

  private puppeteerBrowserOptions = {
    args: ['--no-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
    ignoreHTTPSErrors: true,
  };

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility,@typescript-eslint/explicit-module-boundary-types
  constructor(scratchOrgAdminUsername: string, ux, msgs, options) {
    this.scratchOrgAdminUsername = scratchOrgAdminUsername;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.ux = ux;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.options = options;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.msgs = msgs;
  }

  public async modifyPerms(perms: string[], isRemove: boolean): Promise<void> {
    const puppeteerHoseMyOrg = await this.helper();
    const page = puppeteerHoseMyOrg.page;
    const browser = puppeteerHoseMyOrg.browser;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await page.evaluate((_) => {
        Array.from(document.querySelectorAll('label'))
          .filter((e) => perms.indexOf(e.innerText) >= 0)
          .forEach((e) => (e.previousSibling['checked'] = isRemove ? '' : 'checked'));
      });
      await page.click("input[value='Save']", { delay: 5000 });
    } finally {
      await browser.close();
      if (isRemove)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        this.ux.stopSpinner(this.msgs.getMessage('create.permsDisabled'));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      else this.ux.stopSpinner(this.msgs.getMessage('create.permsEnabled'));
    }
  }

  public async addB2CLiteAccessPerm(): Promise<void> {
    await this.modifyPerms(['B2CLiteAccess', 'CommerceEnabled'], false);
  }

  public async modifyCDNAccessPerm(isRemove: boolean): Promise<void> {
    await this.modifyPerms(['ConnectCdnApiCacheEnabled', 'AcceptCdnRequestOnly', 'CdnSdcOnlyForSiteEnabled'], isRemove);
  }

  private async helper(): Promise<PuppeteerObj> {
    if (!this.ux) {
      this.ux = console;
      /* eslint-disable @typescript-eslint/no-unsafe-member-access,no-console */
      this.ux['setSpinnerStatus'] = console.log;
      this.ux['stopSpinner'] = console.log;
      this.ux['startSpinner'] = console.log;
      this.ux['log'] = console.log;
      /* eslint-disable @typescript-eslint/no-unsafe-member-access,no-console */
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.ux.startSpinner('Updating required permissions');
    let pupOptions = this.puppeteerBrowserOptions;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    if (this.options) pupOptions = { ...pupOptions, ...this.options };
    const browser = await puppeteer.launch(pupOptions);
    const openResponse = shellJsonSfdx(
      `sfdx force:org:open -p /qa/hoseMyOrgPleaseSir.jsp -u "${this.scratchOrgAdminUsername}" -r --json`
    );
    const url = openResponse.result['url'] as string;
    const page = await browser.newPage();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.ux.setSpinnerStatus(`opening ${url}`);
    await page.goto(url);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.ux.setSpinnerStatus(this.msgs.getMessage('create.waitingForStringToLoad', ['hoseMyOrgPleaseSir.jsp']));
    await page.waitForSelector('label', { timeout: 20000 });
    return { browser, page };
  }
}

class PuppeteerObj {
  public browser: Browser;
  public page: Page;
}
