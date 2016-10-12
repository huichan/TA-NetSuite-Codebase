/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 Aug 2016     Chan
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function postRESTlet(dataIn) {
	
	var dataOut = {};
	var soId = dataIn.internalId;
	var csId = ''
	nlapiLogExecution('DEBUG', 'dataIn', soId);

	

	var newCashSale = nlapiTransformRecord('salesorder', soId, 'cashsale', {
		'customform': '112'
	});
	
	try {
		csId = nlapiSubmitRecord(newCashSale, true, true);
	} catch(e) {
		dataOut.success = false;
		dataOut.error = e.details;
		dataOut.message = "There was an error in processing the payment";
	}
	
	
	if(csId) {
		dataOut.success = true;
		dataOut.csId = csId;
	}
	nlapiLogExecution('DEBUG', 'dataOut', JSON.stringify(dataOut));
	return dataOut;
}
