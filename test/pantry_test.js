const chai = require('chai');
const expect = chai.expect;

const pantry = require('../pantry');

describe ('isSnackMessageTrue', () => {
    const res = pantry.isSnackMessage("snack fig bar");
    expect(res).to.be.true;
});

describe ('isSnackMessageFalse', () => {
    const res = pantry.isSnackMessage("hi there");
    expect(res).to.be.false;
});

describe ('extractSnackSupported', () => {
    const res = pantry.extractSnackFromMessage("snack beef jerky");
    expect(res).to.be.eq("beef jerky");
});

describe ('extractSnackNoMatch', () => {
    const res = pantry.extractSnackFromMessage("snack taco");
    // no match
    expect(res).to.be.null;
});