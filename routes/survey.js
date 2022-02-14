var express = require('express');
var router = express.Router();
var gsheets = require('../google-sheet');

router.post('/', async function(req, res, next) {
  if (req.query.command.trim() !== 'save_survey_data') {
    return next();
  }
  try {
    const payload = formatData({
      requestTime: req.requestTime,
      ...req.query,
    });

    const oAuth2Client = await gsheets.authorize();
    const pass2Sheets = await gsheets.writeSheetData(oAuth2Client, payload);
    console.log('sheet response:', pass2Sheets);
    res.send(`success! ${JSON.stringify(pass2Sheets)}`);
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

/**
 * 整理資料，欄位順序如下：
 * @param {datetime} requestTime - A1: 問卷時間
 * @param {string} name - A2: 姓名
 * @param {string} phone - A3: 電話
 * @param {string} email - A4: E-Mail
 * @param {boolean} accept - A5: 是否想與我熱線
 * @param {string} choice[0] - A6: 購買原因
 * @param {string} choice[1] - A7: 性別
 * @param {string} choice[2] - A8: 年齡
 * @param {string} choice[3] - A9: 目前床墊軟硬度
 * @param {string} choice[4] - A10: 想改善的困擾
 * @param {string} choice[5] - A11: 最適合床款
 * @returns Array
 */
function formatData(data) {
  const { requestTime, member, choices } = data;
  const { name, phone, email, accept } = member;
  const { ...choice } = choices.split(',');

  const payload = [
    requestTime,
    name.trim(),
    phone.trim(),
    email.trim(),
    accept.trim() === 'true' ? '是' : '否',
    choice[0].trim(),
    choice[1].trim(),
    choice[2].trim(),
    choice[3].trim(),
    choice[4].trim(),
    choice[5].trim(),
  ];

  return payload;
}

module.exports = router;
