/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest, browser */

const assert = require('assert');
const fs = require('fs');
const jsdom = require('jsdom');
const Util = require('../../../../report/html/renderer/util.js');
const DOM = require('../../../../report/html/renderer/dom.js');
const DetailsRenderer = require('../../../../report/html/renderer/details-renderer.js');
const CategoryRenderer = require('../../../../report/html/renderer/category-renderer.js');
const sampleResultsOrig = require('../../../results/sample_v2.json');

const TEMPLATE_FILE = fs.readFileSync(__dirname +
    '/../../../../report/html/templates.html', 'utf8');

describe('PerfCategoryRenderer', () => {
  let category;
  let pwaRenderer;
  let sampleResults;

  beforeAll(() => {
    global.Util = Util;
    global.CategoryRenderer = CategoryRenderer;

    const PwaCategoryRenderer =
        require('../../../../report/html/renderer/pwa-category-renderer.js');

    const {document} = new jsdom.JSDOM(TEMPLATE_FILE).window;
    const dom = new DOM(document);
    const detailsRenderer = new DetailsRenderer(dom);
    pwaRenderer = new PwaCategoryRenderer(dom, detailsRenderer);

    sampleResults = Util.prepareReportResult(sampleResultsOrig);
    category = sampleResults.reportCategories.find(cat => cat.id === 'pwa');
  });

  afterAll(() => {
    global.Util = undefined;
    global.CategoryRenderer = undefined;
  });

  it('renders the regular audits', () => {
    const categoryElem = pwaRenderer.render(category, sampleResults.categoryGroups);
    const allAuditElements = Array.from(categoryElem.querySelectorAll('.lh-audit'));
    const manualElements = Array.from(categoryElem.querySelectorAll('.lh-clump--manual .lh-audit'));
    const regularAuditElements = allAuditElements.filter(el => !manualElements.includes(el));

    const nonManualAudits = category.auditRefs
      .filter(audit => audit.result.scoreDisplayMode !== 'manual');

    assert.strictEqual(regularAuditElements.length, nonManualAudits.length);
  });

  it('renders the manual audits', () => {
    const categoryElem = pwaRenderer.render(category, sampleResults.categoryGroups);
    const manualElements = categoryElem.querySelectorAll('.lh-clump--manual .lh-audit');

    const manualAudits = category.auditRefs
      .filter(audit => audit.result.scoreDisplayMode === 'manual');

    assert.strictEqual(manualElements.length, manualAudits.length);
  });

  it('manual audits are the only clump', () => {
    const categoryElem = pwaRenderer.render(category, sampleResults.categoryGroups);
    const clumpElems = categoryElem.querySelectorAll('.lh-clump');
    assert.strictEqual(clumpElems.length, 1);
    assert.ok(clumpElems[0].classList.contains('lh-clump--manual'));
  });

  it('renders the audit groups', () => {
    const categoryGroupIds = new Set(category.auditRefs.filter(a => a.group).map(a => a.group));
    assert.strictEqual(categoryGroupIds.size, 3); // Ensure there's something to test.

    const categoryElem = pwaRenderer.render(category, sampleResults.categoryGroups);

    categoryGroupIds.forEach(groupId => {
      const selector = `.lh-audit-group--${groupId}`;
      // Expected that only the non-manual audits will be grouped.
      assert.strictEqual(categoryElem.querySelectorAll(selector).length, 1,
        `trouble with selector '${selector}'`);
    });
  });
});
