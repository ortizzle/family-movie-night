/* Shared plumbing for the Playwright suites.

   Two things live here rather than in each suite, because both have bitten:
   the path to the app (tests get copied around; a hardcoded /home/... path
   dies the moment the repo lives somewhere else) and the path to Chromium
   (the container's build number changes). */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

/* the BUILT file, always — testing src/shell.html tests something nobody ships */
const APP = 'file://' + path.resolve(__dirname, '..', '..', 'index.html');

/* PLAYWRIGHT_BROWSERS_PATH is set in the container; the numbered directory
   under it is not stable, so find it rather than naming it. */
function chromePath(){
  if (process.env.FMN_CHROME) return process.env.FMN_CHROME;
  var root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  var direct = path.join(root, 'chromium');
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  var hit = null;
  (fs.existsSync(root) ? fs.readdirSync(root) : []).forEach(function(d){
    if (hit || d.indexOf('chromium-') !== 0) return;
    var p = path.join(root, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) hit = p;
  });
  if (!hit) throw new Error('no Chromium found under ' + root + ' — set FMN_CHROME');
  return hit;
}

function launch(){
  return chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox'] });
}

/* A Pixel 8 Pro is what the family actually holds; 390 is the narrowest phone
   worth caring about. Suites default to the Pixel. */
const PIXEL = { width: 412, height: 915 };
const NARROW = { width: 390, height: 844 };

/* 1x1 transparent PNG — stands in for every poster fetch */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64');

/* Results are appended to a log file as they happen, not held until the end.
   A suite that hangs on the last case used to print nothing at all, which made
   a slow run and a stuck run look identical. */
function reporter(name){
  const logPath = path.resolve(__dirname, '..', name + '.log');
  try { fs.unlinkSync(logPath); } catch (e){}
  const lines = [];
  return {
    check: function(label, ok, detail){
      const line = (ok ? 'PASS' : 'FAIL') + '  ' + label + (detail ? '  ' + JSON.stringify(detail) : '');
      lines.push(line);
      fs.appendFileSync(logPath, line + '\n');
    },
    note: function(msg){ fs.appendFileSync(logPath, '-> ' + msg + '\n'); },
    /* browser.close() has hung here before; the exit code is what matters */
    finish: function(browser, errors){
      return Promise.resolve(browser && browser.close()).catch(function(){}).then(function(){
        console.log(lines.join('\n'));
        console.log('\npage errors: ' + (errors && errors.length ? '\n  ' + errors.join('\n  ') : 'none'));
        const failed = lines.filter(function(l){ return l.indexOf('FAIL') === 0; }).length;
        console.log(failed ? '\n' + failed + ' FAILED' : '\nall green');
        process.exit(failed || (errors && errors.length) ? 1 : 0);
      });
    }
  };
}

module.exports = { APP, PNG, PIXEL, NARROW, launch, chromePath, reporter };
