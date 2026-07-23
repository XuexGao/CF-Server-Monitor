import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  appendAgentUpdateParam,
  buildAgentConfig,
  describeAgentConfig,
  isAgentAutoUpdateEnabled,
  isValidTrafficCorrection,
  serializeAgentConfig,
  serializeCorrection,
  shouldSendAgentUpdate,
  validateAgentConfigInput,
  validatePingNode
} from '../src/utils/agentConfig.js';
import { md5Hash } from '../src/utils/common.js';

const server = {
  collect_interval: 1,
  report_interval: 60,
  reset_day: 15
};
const expected = 'collect_interval=1&report_interval=60&reset_day=15&schema_version=2&custom_ct=&custom_cu=&custom_cm=&custom_bd=';

const config = buildAgentConfig(server);
assert.equal(serializeAgentConfig(config), expected);
assert.equal(appendAgentUpdateParam(expected, true), `${expected}&update=1`);
assert.equal(appendAgentUpdateParam('', true), 'update=1');
assert.equal(appendAgentUpdateParam(expected, false), expected);
assert.equal(isAgentAutoUpdateEnabled('1'), true);
assert.equal(isAgentAutoUpdateEnabled(1), true);
assert.equal(isAgentAutoUpdateEnabled('true'), false);
assert.equal(shouldSendAgentUpdate('1.3.0', '1.3.0'), false);
assert.equal(shouldSendAgentUpdate('v1.3.0', '1.3.0'), false);
assert.equal(shouldSendAgentUpdate('1.2.9', '1.3.0'), true);
assert.equal(shouldSendAgentUpdate('', '1.3.0'), false);
assert.equal(shouldSendAgentUpdate('1.3.0', ''), false);

const descriptor = await describeAgentConfig(server);
assert.equal(descriptor.serialized, expected);
assert.equal(descriptor.md5, createHash('md5').update(expected).digest('hex'));
assert.equal(descriptor.correction, null);

const autoUpdateDescriptor = await describeAgentConfig({ ...server, auto_update: '1' });
assert.equal(autoUpdateDescriptor.serialized, expected);
assert.equal(autoUpdateDescriptor.md5, descriptor.md5);

const correctionDescriptor = await describeAgentConfig({ ...server, rx_correction: null, tx_correction: 5 });
assert.deepEqual(correctionDescriptor.correction, {
  rx_correction: 0,
  tx_correction: 5
});
assert.equal(serializeCorrection(correctionDescriptor.correction), '&rx_correction=0&tx_correction=5');
assert.equal(isValidTrafficCorrection('0'), true);
assert.equal(isValidTrafficCorrection('0.5'), true);
assert.equal(isValidTrafficCorrection('1000000'), true);
assert.equal(isValidTrafficCorrection('-1'), false);
assert.equal(isValidTrafficCorrection('1e3'), false);
assert.equal(isValidTrafficCorrection('0x10'), false);
assert.equal(isValidTrafficCorrection('1000000.1'), false);

for (const value of ['', 'abc', '中文', 'a'.repeat(1000)]) {
  assert.equal(await md5Hash(value), createHash('md5').update(value).digest('hex'));
}

assert.equal(validateAgentConfigInput(server).valid, true);
assert.equal(validateAgentConfigInput({ ...server, collect_interval: '1' }).valid, false);
assert.equal(validateAgentConfigInput({ ...server, reset_day: 32 }).valid, false);
assert.deepEqual(buildAgentConfig({}), {
  collect_interval: 0,
  report_interval: 60,
  reset_day: 1,
  custom_ct: '',
  custom_cu: '',
  custom_cm: '',
  custom_bd: '',
  schema_version: 2
});

// Test server-level ping node priority
const serverWithCustomPing = {
  collect_interval: 0,
  report_interval: 60,
  reset_day: 1,
  custom_ct: 'ct-server.example.com',
  custom_cu: '',
  custom_cm: '',
  custom_bd: ''
};
const settings = { custom_ct: 'ct-global.example.com', custom_cu: 'cu-global.example.com', custom_cm: 'cm-global.example.com', custom_bd: 'bd-global.example.com' };
const resolvedConfig = buildAgentConfig(serverWithCustomPing, settings);
assert.equal(resolvedConfig.custom_ct, 'ct-server.example.com');
assert.equal(resolvedConfig.custom_cu, 'cu-global.example.com');
assert.equal(resolvedConfig.custom_cm, 'cm-global.example.com');
assert.equal(resolvedConfig.custom_bd, 'bd-global.example.com');
assert.equal(buildAgentConfig({ custom_ct: 'gd-ct-v4.ip.zstaticcdn.com:80' }).custom_ct, 'gd-ct-v4.ip.zstaticcdn.com:80');
assert.equal(buildAgentConfig({ custom_ct: 'GD-CT-V4.IP.ZSTATICCDN.COM:080' }).custom_ct, 'gd-ct-v4.ip.zstaticcdn.com:80');
assert.equal(buildAgentConfig({ custom_ct: 'a'.repeat(100) }).custom_ct, '');
assert.equal(buildAgentConfig({ custom_ct: 'gd-ct-v4.ip.zstaticcdn.com:99999' }).custom_ct, '');
assert.equal(buildAgentConfig({ custom_ct: 'foo:bar' }).custom_ct, '');
assert.equal(buildAgentConfig({ custom_ct: '2001:db8::1' }).custom_ct, '');
assert.deepEqual(validatePingNode('foo:443'), { valid: true, value: 'foo:443' });
assert.equal(validatePingNode('foo:bar').valid, false);
assert.equal(validatePingNode('2001:db8::1').valid, false);

console.log('agent config tests passed');
