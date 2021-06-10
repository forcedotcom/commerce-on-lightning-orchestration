# Commerce Orchestration Plugin

[![Version](https://img.shields.io/npm/v/1commerce.svg)](https://npmjs.org/package/1commerce)
[![CircleCI](https://circleci.com/gh/1commerce/1commerce/tree/master.svg?style=shield)](https://circleci.com/gh/1commerce/1commerce/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/1commerce/1commerce?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/1commerce/branch/master)
[![Codecov](https://codecov.io/gh/1commerce/1commerce/branch/master/graph/badge.svg)](https://codecov.io/gh/1commerce/1commerce)
[![Greenkeeper](https://badges.greenkeeper.io/1commerce/1commerce.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/1commerce/1commerce/badge.svg)](https://snyk.io/test/github/1commerce/1commerce)
[![Downloads/week](https://img.shields.io/npm/dw/1commerce.svg)](https://npmjs.org/package/1commerce)
[![License](https://img.shields.io/npm/l/1commerce.svg)](https://github.com/1commerce/1commerce/blob/master/package.json)
==============

- [Install](#install)
- [Post Install](#now-that-you-have-the-commerce-plugin-installed-please-see)
- [Commands](#commands)
- [Debugging your plugin](#debugging-your-plugin)
<!-- install -->

## Install

<strong>Intended for most users</strong>

First install the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli).
Next install the commerce orchestration plugin

```
echo y | sfdx plugins:install ssh://git@git.soma.salesforce.com:communities/commerce-on-lightning-orchestration.git
```

Now, you can run the commerce commands.

```
sfdx commerce:setup
```

See below for the full list of commands.

### To run from local git repo:

<strong>Intended for plugin developers or people trying out a workaround and don't want to override there b2c sfdx plugin.</strong>

```
$ yarn install
$ bin/run b2c
```

### When you’re ready to test-drive your plug-in from local git repo, link your git repo to Salesforce CLI.

<strong>Intended for plugin developers or people trying out a workaround and want this to be their default for sfdx b2c commands</strong>
from inside the root of the git repo

```
sfdx plugins:link
```

## Now that you have the b2c plugin installed please see:

- [Usage Wiki](https://git.soma.salesforce.com/communities/1commerce/wiki/Usage)
- [Quip Doc: [WIP] B2C Store Setup using SFDX](https://salesforce.quip.com/xMU3ATjR1QQa)

<!-- installstop -->

## Commands

<!-- commands -->
* [`sfdx commerce:devhub:auth [-c <filepath>] [-F <filepath>] [-J] [-i <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-commercedevhubauth--c-filepath--f-filepath--j--i-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx commerce:open:devhubconfig [-e <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-commerceopendevhubconfig--e-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx commerce:scratchorg:create [-c <filepath>] [-a <string>] [-v <string>] [-u <string>] [-n <number>] [-p] [-g <string>] [-t <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-commercescratchorgcreate--c-filepath--a-string--v-string--u-string--n-number--p--g-string--t-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx commerce:devhub:auth [-c <filepath>] [-F <filepath>] [-J] [-i <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Authorize a devhub

```
USAGE
  $ sfdx commerce:devhub:auth [-c <filepath>] [-F <filepath>] [-J] [-i <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -F, --server-cert=server-cert                                                     [default:
                                                                                    /Users/jarndt/.commerce/.certs/serve
                                                                                    r.crt] Server Cert file

  -J, --use-jwt                                                                     Use JWT to auth

  -c, --configuration=configuration                                                 [default:
                                                                                    /Users/jarndt/.commerce/devhub-confi
                                                                                    guration.json] Pass in config to
                                                                                    override default

  -i, --client-id=client-id                                                         Client Id for auth:web:login

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx commerce:devhub:auth --configuration devhub-configuration.json
```

## `sfdx commerce:open:devhubconfig [-e <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Open devhub-configuration.json file

```
USAGE
  $ sfdx commerce:open:devhubconfig [-e <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -e, --editor=editor                                                               [default: vi] Editor to open file
                                                                                    with

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx commerce:open:devhubconfig -e atom
```

## `sfdx commerce:scratchorg:create [-c <filepath>] [-a <string>] [-v <string>] [-u <string>] [-n <number>] [-p] [-g <string>] [-t <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Create a scratch org

```
USAGE
  $ sfdx commerce:scratchorg:create [-c <filepath>] [-a <string>] [-v <string>] [-u <string>] [-n <number>] [-p] [-g 
  <string>] [-t <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -a, --hub-org-admin-username=hub-org-admin-username                               [default: ceo@mydevhub.com] username
                                                                                    of the hub org admin

  -c, --configuration=configuration                                                 [default:
                                                                                    /Users/jarndt/.commerce/devhub-confi
                                                                                    guration.json] Pass in config to
                                                                                    override default

  -g, --scratch-org-alias=scratch-org-alias                                         [default: devhub] Alias name for
                                                                                    this scratch org

  -n, --scratch-org-number=scratch-org-number                                       Which store to create from config
                                                                                    file scratchOrgs list -1 for all
                                                                                    stores

  -p, --is-b2c-lite-access-perm-needed                                              Should the script run sfdx
                                                                                    force:org:open and wait for you to
                                                                                    save B2CLiteAccessPerm?

  -t, --type=type                                                                   [default: b2c] b2b or b2c

  -u, --scratch-org-admin-username=scratch-org-admin-username                       [default: demo@1commerce.com]
                                                                                    username of the admin to associate
                                                                                    with the scratch org.

  -v, --api-version=api-version                                                     [default: 52.0] Version of current
                                                                                    Salesforce

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx commerce:scratchorg:create --configuration devhub-configuration.json
```
<!-- commandsstop -->
<!-- debugging-your-plugin -->

# Debugging your plugin

We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command:

1. Start the inspector

If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch:

```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```

Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:

```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program.
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
   <br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
   Congrats, you are debugging!
