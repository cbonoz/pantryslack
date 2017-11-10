const chai = require('chai');
const expect = chai.expect;

const pantry = require('../pantry');

describe ('isSupplyMessageTrue', () => {
    const res = pantry.isSupplyMessage("snack bagels");
    expect(res).to.be.true;
});

describe ('isSupplyMessageFalse', () => {
    const res = pantry.isSupplyMessage("hi there");
    expect(res).to.be.false;
});

describe ('isSupplyMessageOtherWords', () => {
    const res = pantry.isSupplyMessage("What is the current supply of Bagels?");
    expect(res).to.be.true;
});

describe ('isOrderMessageTrue', () => {
    const res = pantry.isOrderMessage("order more bagels");
    expect(res).to.be.true;
});

describe ('isOrderMessageFalse', () => {
    const res = pantry.isOrderMessage("I'm not sure what I want");
    expect(res).to.be.false;
});

describe ('extractSnackSupported', () => {
    const res = pantry.extractSnackFromMessage("snack bagels");
    expect(res).to.be.eq("bagels");
});

describe ('extractSnackSupportedWithExtraWords', () => {
    const res = pantry.extractSnackFromMessage("give me snack info for bagels");
    expect(res).to.be.eq("bagels");
});

describe ('extractSnackNoMatch', () => {
    const res = pantry.extractSnackFromMessage("snack taco");
    // no match
    expect(res).to.be.null;
});

describe ('formatTimeMs', () => {
    const timeMs = 1510252871000;
    const dateTimeMs = new Date(timeMs);
    const res = pantry.formatDateTimeMs(dateTimeMs);
    console.log(res);
    expect(res).to.contain("Nov 09 2017");
    expect(res).to.contain("1:41:11 PM");
});