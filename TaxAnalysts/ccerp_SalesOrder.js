/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Oct 2014     Dana
 *
 */
function taPopupCenter(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(url, title, 'toolbar=yes, dependent=yes, location=yes, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }
}

function taSalesOrder_SaveRecord() {
	var custId = nlapiGetFieldValue('entity');
	var invoice_email = nlapiLookupField('customer', custId, ['custentity_ta_invoice_email_address', 'custentity_ta_invoice_email_name']);
	var role = nlapiGetRole();
	if(role == '1021' || role == '3'){
		return true;
	}
	else{
		if(nlapiGetFieldValue('custbody_prompt_email_check') == 'T' || isEmpty(invoice_email.custentity_ta_invoice_email_address) || isEmpty(invoice_email.custentity_ta_invoice_email_name)){
			
			var url = nlapiResolveURL('SUITELET', 'customscript_sales_order_check_suitelet', 'customdeploy1');
	
			url += '&custId=' + custId;
			//window.open(url,'','toolbar=yes, dependent=yes, location=yes, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=yes, width=500, height=440');
			taPopupCenter(url, null, 500, 440);
			nlapiSetFieldValue('custbody_prompt_email_check', 'F');
			return false;
		}else {
			return true;
		}
	}
}

function taSalesOrder_EmailCheck_Suitelet(request, response) {
	nlapiLogExecution('DEBUG', 'Email Check Suitelet', 'Suitelet Begins');
	var custId = request.getParameter('custId');
	
	nlapiLogExecution('DEBUG', 'custId', custId);
	
	if(request.getMethod() == 'GET'){
		
		var form = nlapiCreateForm('Set Invoice Email', true);
		form.setScript('customscript_ta_invoice_email_check');
		//form.addSubmitButton('Confirm');
		
		
		
		var cust_id_fld = form.addField('cust_id_fld', 'text');
		cust_id_fld.setDefaultValue(custId);
		cust_id_fld.setDisplayType('hidden');
		var cust_rec = nlapiLoadRecord('customer', custId);
		var acct_email = cust_rec.getFieldValue('email');
		var current_email_fld = form.addField('invoice_email', 'email', 'Invoice Will Email To');
		var current_name_fld = form.addField('invoice_name', 'text', 'Name of Invoice Email Recipient');
		current_email_fld.setLayoutType('startrow', 'startcol');
		var current_email = cust_rec.getFieldValue('custentity_ta_invoice_email_address');
		var current_name = cust_rec.getFieldValue('custentity_ta_invoice_email_name');
		current_email_fld.setDefaultValue(current_email || ''); 
		current_email_fld.setDisplaySize(30);
		
		current_name_fld.setDisplaySize(30);
		current_name_fld.setDefaultValue(current_name || '');
		
		var invoice_print_check = form.addField('print_check','checkbox','Send Invoice Print');
		invoice_print_check.setDefaultValue('T');
		
		if(acct_email){
		
			var default_email_label = form.addField('def_email_label', 'inlinehtml');
			default_email_label.setDefaultValue('<h1 style="font-size: 14px; margin-top: 15px; display: inline-block;">Use Company Email:</h1><p style="font-size: 12px; margin-left: 10px; display: inline-block;">'
			+ acct_email +' <span id="primary_email" style="border: 1px solid green; display: inline-block; margin-left: 10px; cursor: pointer; padding: 5px 10px; font-weight: bold; color: #fff; background: #75C9C8; display: inline-block; text-align:center;">SET</span></p>');
		
		}
		var contact_select = form.addField('contact_select_label','inlinehtml');
		contact_select.setDefaultValue('<h1 style="font-size: 14px; margin-top: 15px;"> Select Exisiting Contact: </h1>');
		var contact_select = form.addField('contact_select', 'select', 'Click to Select');
		//contact_select.setLayoutType('normal', 'startcol');
		contact_select.addSelectOption('', '', true);
		// self invoking function to display Contact.
		(function () {
			var filters = [];
			var columns = [];
			filters.push(new nlobjSearchFilter('company', null, 'is', custId));
			filters.push(new nlobjSearchFilter('email', null, 'isnot', '@NONE@'));
			filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
			columns.push(new nlobjSearchColumn('entityid'));
			columns.push(new nlobjSearchColumn('email'));
			var src_result = nlapiSearchRecord('contact', null, filters, columns);
			if(isNotEmpty(src_result)){
				for(var i = 0; i < src_result.length; i += 1){
					var internal_id = src_result[i].getId();
					var contact_name = src_result[i].getValue('entityId');
					var contact_email = src_result[i].getValue('email');
					
					contact_select.addSelectOption(internal_id, contact_name);
				}
				
			}
			
		})();
		var confirm_fld = form.addField('confirm2', 'inlinehtml');
		confirm_fld.setLayoutType('normal');
		confirm_fld.setDefaultValue('<style>button{ position: relative; width: 90%; border-bottom: 1px solid green; padding: 5px; margin: 20px 7px; color: #fff; font-weight: bold; background: #75C9C8;}</style><button>SUBMIT</button>');
		
		
		response.writePage(form);
	}
	else{
		var email = request.getParameter('invoice_email');
		var name = request.getParameter('invoice_name');
		var cust_id = request.getParameter('cust_id_fld');
		var print_check = request.getParameter('print_check');
		var cust_rec = nlapiLoadRecord('customer', cust_id);
		
		// if new email is different then update 
		if(email != cust_rec.getFieldValue('custentity_ta_invoice_email_address')) cust_rec.setFieldValue('custentity_ta_invoice_email_address', email);
		// if new name is different then update
		if(name != cust_rec.getFieldValue('custentity_ta_invoice_email_name')) cust_rec.setFieldValue('custentity_ta_invoice_email_name', name);
		// if print check is false then set Send Print Invoice to No
		print_check != 'T' ? cust_rec.setFieldValue('custentity_ta_invoice_method', '1') : cust_rec.setFieldValue('custentity_ta_invoice_method', '2');
		try{
		//submit customer record
			var cust_rec_id = nlapiSubmitRecord(cust_rec, null, true);
			if(cust_rec_id){
				var html = "<script>window.close()</script>";
				response.write(html);
			}
		}
		catch(e){
			throw "Error in processing " + e;
		}
	}
}



function ccerpSalesOrder_BeforeLoad(type, form, request){
	nlapiLogExecution('debug', 'Before Load '+type);
	
	if (type == 'create' || type == 'edit'){
		var ordtype = nlapiGetFieldValue('custbody_order_type');
		if (ordtype == 2){
		BodyFieldInline('custbody_contract_name');
		}
		if(type == 'create'){
			
			// Setting Invoice To Email Flag.
			nlapiSetFieldValue('custbody_prompt_email_check', 'T');
			
			//*** Checks New New Business on Creation of Sales Order if conditions are met ****//
			
			var custId = nlapiGetFieldValue('entity');
			if(isNotEmpty(custId)){
				var retainedUntil = nlapiLookupField('customer', custId, 'custentity_ta_retained_until');
				var trandate = moment(nlapiGetFieldValue('trandate'));
				nlapiLogExecution('debug', 'Before Load', 'custId = ' + custId + ' retainedUntil = ' + retainedUntil );
				nlapiLogExecution('debug', 'Before Load', 'Typeof = ' + typeof(retainedUntil));
				
				if(retainedUntil == '' || retainedUntil == null){
					nlapiSetFieldValue('custbody_new_business_check', 'T');
				}
				else {
					var retainedUntil = moment(retainedUntil);
					var sixMonthsAddedRU = retainedUntil.add(6, 'months');
					if(trandate._d > sixMonthsAddedRU._d){
						nlapiSetFieldValue('custbody_new_business_check', 'T');
					}
				}
			}
		}		
	}
}


function ccerpSalesOrder_BeforeSubmit(type){
	nlapiLogExecution('debug', 'Before Submit '+type);
	var customer = nlapiGetFieldValue('entity');
	var soid = nlapiGetRecordId();
	if (type == 'create' || type == 'edit'){
		var count = nlapiGetLineItemCount('item');
		var custtot = 0;
		
		var role = nlapiGetRole();
		for (var i = 1; i <= count;  i++) {
			var revrec = nlapiGetLineItemValue('item','revrecschedule',i);
			if (revrec){
				var startdate = nlapiGetLineItemValue('item','custcol_swe_contract_start_date',i);
				var enddate = nlapiGetLineItemValue('item','custcol_swe_contract_end_date',i);
				nlapiSetLineItemValue('item','revrecstartdate',i,startdate);
				nlapiSetLineItemValue('item','revrecenddate',i,enddate);
			}
			
			var item = nlapiGetLineItemValue('item','item',i);
			var lineQty = MyParseFloat(nlapiGetLineItemValue('item','quantity',i));
			var lineTerm = MyParseFloat(nlapiGetLineItemValue('item','custcol_swe_contract_item_term_months',i));
			var pricelevel = nlapiGetLineItemValue('item','price',i);
			if (pricelevel == '10')
				continue;
			var customerItemRate = MyParseFloat(ccerpGetCustomerQtyRate(customer, item, lineQty));
			nlapiLogExecution('debug','customerItemRate in BeforeSubmit '+customerItemRate);
			var custLineAmount = (customerItemRate/12)*lineTerm*lineQty;
			nlapiLogExecution('debug','custLineAmount '+custLineAmount+', lineTerm '+lineTerm+', lineQty '+lineQty);
			custtot += MyParseFloat(custLineAmount);
			nlapiLogExecution('debug','custtot in BeforeSubmit '+custtot);
			
		}
		nlapiSetFieldValue('custbody_regular_item_price_total', custtot);
	}
	
	
	if (type == 'delete') {

		/**
		 *  If Sales Order is deleted reduce TNL credit remaining 
		 */

		var itemCount = nlapiGetLineItemCount('item');
		var credit_to_remove = 0;
		for(var i = 1; i <= itemCount; i++) {
			if( nlapiGetLineItemValue('item', 'item', i) == "2076") {
				credit_to_remove += parseInt(nlapiGetLineItemValue('item', 'quantity', i));
			}
		}			
		if(credit_to_remove > 0) {
			var curr_credit = parseInt(nlapiLookupField('customer', customer, 'custentity_tnl_credit_remaining')) || 0;
			var new_credit = curr_credit >= credit_to_remove ? (curr_credit - credit_to_remove) : 0;
			nlapiSubmitField('customer', customer, ['custentity_tnl_credit_remaining', 'custentity_last_sold_tnl_block'], [new_credit, 0], false);
		}
		
		// Erase contract values in From Contract
		if(soid > -1) {
			var from_contract_id = nlapiGetFieldValue('custbody_swe_from_contract');
			nlapiLogExecution('DEBUG', 'TYPE DELETE: from_contract_id', from_contract_id)
			if(from_contract_id) {
				var FIELDS = ['custrecord_ta_renewed_value', 'custrecord_ta_renewed_coterm_value', 'custrecord_ta_sales_renewed_value'];
				nlapiSubmitField('customrecord_contracts', from_contract_id, FIELDS, [0, 0, 0]);
			}
				
		}
	}
	
	// Approval Event
	if(type == 'approve') {
		var contractTerm = nlapiGetFieldValue('custbody_tran_term_in_months');
		var soTotal = nlapiGetFieldValue('total');
		// Send Email to Finance, if term is greater than 15 months
		if(+contractTerm > 15 && +soTotal > 0) {
			var link = 'https://system.na1.netsuite.com';
			link += nlapiResolveURL('RECORD', 'salesorder', soid);
			var subject = 'New Multiyear Sales Order has been approved';
			var author = '17634'; // Sharon Calvert
			var recipient = '17857'; // Duc
			var cc = ['chan.yi@taxanalysts.org', 'richa.dahiya@taxanalysts.org', 'michael.berkeley@taxanalysts.org', 'sharon.calvert@taxanalysts.org'];
			var body = 'New Sales Order with contract term greater than 15 months has been approved. <br/><br/>' +
			'Please review by following the link below<br/>';
			body += '<a href="'+ link +'"> Click to access Sales Order </a>';
			
			nlapiSendEmail(author, recipient, subject, body, cc);
		}
	}
}



function ccerpSalesOrder_AfterSubmit(type){
	nlapiLogExecution('debug', 'After Submit '+type);
	
	//var user = nlapiGetUser();
	var soid = nlapiGetRecordId();
	var esid = nlapiGetFieldValue('createdfrom');
	var opid = nlapiGetFieldValue('opportunity');
	var context = nlapiGetContext();
	var executionContext = context.getExecutionContext();

	//Update Contract users for from and coTerm contracts 
	if (type == 'edit' || type == 'xedit' || type == 'approve'){
		nlapiLogExecution('debug', 'Update Contract Users ');
		var sorec = nlapiLoadRecord('salesorder',soid);
		var oldrec = nlapiGetOldRecord();
		var enddate = sorec.getFieldValue('enddate');
		var contractId = sorec.getFieldValue('custbody_contract_name');
		var from_contract_id = nlapiGetFieldValue('custbody_swe_from_contract'); 
		var custId = nlapiGetFieldValue('entity');
		var coTermcontracts = sorec.getFieldValues('custbody_cotermcontracts');
		nlapiLogExecution('debug','coTermcontracts '+coTermcontracts);
		var priorcontract = sorec.getFieldValue('custbody_swe_from_contract');
		nlapiLogExecution('debug','priorcontract '+priorcontract);
		var renewal_value = +nlapiGetFieldValue('custbody_renewedfromcontractvalue');
		// run r03 hourly script after SO gets approved
		var oldDocuStatus = oldrec.getFieldValue('orderstatus');
		var newDocuStatus = sorec.getFieldValue('orderstatus');
		if(oldDocuStatus != newDocuStatus){
			nlapiScheduleScript('customscript_swe_create_contract_items', 'customdeploy5');
		}
		
		if (isNotEmpty(coTermcontracts) || isNotEmpty(priorcontract)){	
			
			var oldlogstatus = oldrec.getFieldValue('custbody_check_log_status');
			var newlogstatus = sorec.getFieldValue('custbody_check_log_status');
			nlapiLogExecution('debug','log status','old '+oldlogstatus+' new '+newlogstatus);
			
			// Fixes reverting Check Log Status 
			if(oldlogstatus === '1' && newlogstatus === '2' && executionContext === 'workflow') {
				nlapiSubmitField('salesorder', soid, 'custbody_check_log_status', '1');
			}
			
			if (oldlogstatus != newlogstatus && newlogstatus == '1'){
				var ContractArr = [];
				if (isNotEmpty(priorcontract))
					ContractArr.push(priorcontract);
				if (isNotEmpty(coTermcontracts)){
					for (var c in coTermcontracts){
						if (ContractArr.indexOf(coTermcontracts[c])==-1){
							ContractArr.push(coTermcontracts[c]);
						}
					}	
				}
				
				var params = [];
				params['custscript_cu_contractids'] = JSON.stringify(ContractArr);
				params['custscript_cu_enddate'] = enddate;
				params['custscript_cu_contractid'] = contractId;
								
				nlapiScheduleScript('customscript_ccerpupdatecontractusersche',null,params);
				
			}
		}
		if(type == 'approve' || type == 'edit') {
			
			nlapiLogExecution('DEBUG', 'Renewal Value for TA Renewed Value', renewal_value);
			// Write TA Renewed Value & TA Renewal Co-term Amount to From Contract 
			if(sorec.getFieldValue('status') == 'Billed' || sorec.getFieldValue('status') == 'Pending Fulfillment') {
				if( coTermcontracts ) {
					nlapiSubmitField('customrecord_contracts', from_contract_id, 'custbody_cotermcontracttotal', +nlapiGetFieldValue('custbody_cotermcontracttotal'));
				}
				if( renewal_value && renewal_value > 0 ) {
					renewal_value >= +nlapiGetFieldValue('total') ? nlapiSubmitField('customrecord_contracts', from_contract_id, 'custrecord_ta_renewed_value', +nlapiGetFieldValue('total'), true) :
						nlapiSubmitField('customrecord_contracts', from_contract_id, 'custrecord_ta_renewed_value', renewal_value, true );
					
					//	Writing TA Sales Renewed Value 
					var sales_renewal_val = nlapiLookupField('customrecord_contracts', from_contract_id, 'custrecord_ta_contract_value');
					sales_renewal_val >= +nlapiGetFieldValue('total') ? nlapiSubmitField('customrecord_contracts', from_contract_id, 'custrecord_ta_sales_renewed_value', +nlapiGetFieldValue('total')) : 
						nlapiSubmitField('customrecord_contracts', from_contract_id, 'custrecord_ta_sales_renewed_value', sales_renewal_val, true );
				}
			}

			// write on TA Retained Until Field if this SO end date is greater
			nlapiLogExecution('debug', 'Updating Retained Until', 'Update Begins');
			
			var soEndDate = sorec.getFieldValue('enddate');
			
			var cuid = custId;
			var custrec = nlapiLoadRecord('customer', cuid);
			var retainedUntil = custrec.getFieldValue('custentity_ta_retained_until');
			nlapiLogExecution('DEBUG', 'Retained Until Update', 'soEndDate = ' + soEndDate + ', retainedUntil = ' + retainedUntil);
			
			if(!retainedUntil || nlapiStringToDate(soEndDate) >= nlapiStringToDate(retainedUntil)) {
				nlapiSubmitField('customer', cuid, 'custentity_ta_retained_until', soEndDate);
			}
		}

		if (type == 'approve'){


			// Update Free Trial User to Contract User
			if(nlapiGetFieldValue('custbody_new_business_check') == 'T') {
				var itemsToUpdate = (function() {
					var itemCount = nlapiGetLineItemCount('item');
					var items = [];
					for(var i = 1; i <= itemCount; i++) {
						var currentItem = nlapiGetLineItemValue('item', 'item', i);
						if(nlapiLookupField('item', currentItem, 'custitem_ta_isonline') == 'T') {
							items.push(currentItem);
						}
					}
					return items;
				})();
				if(itemsToUpdate) {
					var contractId = nlapiGetFieldValue('custbody_contract_name');
					var params = new Object();
					params['custId'] = custId;
					params['contractId'] = nlapiGetFieldValue('custbody_contract_name');
					params['items'] = itemsToUpdate;
					nlapiRequestURL('https://forms.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=267&deploy=1&compid=1257021&h=d38c1be4130aa6c724bf', JSON.stringify(params), null, null, 'POST');
				}
			}
			
			// Close all the other Quotes
			if(isNotEmpty(opid)){
				nlapiLogExecution('debug', 'Closing all the other quotes begins', esid + ", opid: " + opid);
				 //13 is closed won
				var filters = [];
				filters.push(new nlobjSearchFilter('opportunity', null, 'is', opid));
				filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
				
				var result = nlapiSearchRecord('estimate', null, filters);
				if(isNotEmpty(result)){
					nlapiLogExecution('debug', 'Closing all the other quotes... search result length: ', result.length);
					for(var i = 0; i < result.length; i += 1){
						var result_esid = result[i].getId();
						if(result_esid != esid){
							nlapiSubmitField('estimate', result_esid, ['entitystatus', 'status'], ['140', 'Closed']);
						}
					}
				}
			
			}
			
			// if Co-term Contracts are used, close the Opps created from the Co-termed Contract
			if(isNotEmpty(coTermcontracts)){
				
				for(var i = 0; i < coTermcontracts.length; i += 1){
					var coterm_opp_filters = [ new nlobjSearchFilter('custbody_swe_from_contract', null, 'is', coTermcontracts[i]) ];
					var coterm_opp_result = nlapiSearchRecord('opportunity', null, coterm_opp_filters);
					if(isNotEmpty(coterm_opp_result)){
						for(var opp = 0; opp < coterm_opp_result.length; opp += 1){
							var coterm_opp_id = coterm_opp_result[opp].getId();
							nlapiSubmitField('opportunity', coterm_opp_id, ['custbody_ta_opportunity_status', 'entitystatus'], ['11', '135'], true);
						}
					}
					
				}
			}
			

			
			// TNL is discontinued 9/1/2016
			// When TNL is sold, Check 'custentity_tnl_flag' to 'T' 
//			var item_count = sorec.getLineItemCount('item');
//			var tnl_count = 0;
//			var totalCreditCount = 0;
//			for(var i = 1; i <= item_count; i += 1) {
//				if( sorec.getLineItemValue('item', 'item', i) == "2069") tnl_count += 1;
//				if( sorec.getLineItemValue('item', 'item', i) == "2076") totalCreditCount += parseInt(sorec.getLineItemValue('item', 'quantity', i));
//			}
//			if(tnl_count > 0) {
//				// set TNL Flag to TRUE
//				nlapiSubmitField('customer', cuid, 'custentity_tnl_flag', 'T');
//				// Send Email to Sonya (Business Analysts)
//				var link = 'https://system.na1.netsuite.com';
//				link += nlapiResolveURL('RECORD', 'salesorder', soid);
//				var subject = 'Sales Order for Tax Notes Live has been approved';
//				var body = 'There was a Sales Order with Tax Notes Live (Credit Block) and it has been approved.<br/>';
//				body += 'Please validate the quantity and description. <br/><br/>';
//				body += '<a href="'+ link +'">Click here to view the Sales Order</a> '
//				var assoc_rec = new Object();
//				assoc_rec['transaction'] = soid;
//				nlapiSendEmail(nlapiGetFieldValue('salesrep'), '92599', subject, body, null, null, assoc_rec);
//				
//				// When TNL Certificate is sold, get the quantity and set the TNL credit on the customer record
//							
//				if(totalCreditCount > 0) {
//					var curr_credit = parseInt(nlapiLookupField('customer', cuid, 'custentity_tnl_credit_remaining')) || 0;
//					var new_credit = curr_credit + totalCreditCount;
//					nlapiSubmitField('customer', cuid, ['custentity_tnl_credit_remaining', 'custentity_last_sold_tnl_block'], [new_credit, totalCreditCount]);
//				}
//				
//			}
			
			// Send Email notification to Sales Rep 
			var contract_name = nlapiGetFieldText('custbody_contract_name');
			var customer_name = nlapiGetFieldText('entity');
			var doc_num = nlapiGetFieldValue('tranid');
			var author = '17634'; // Set to Sharon(Sales Manager)'s Internal ID
			var recipient = nlapiGetFieldValue('salesrep');
			var records = {};
			records['transaction'] = soid;
			
			var subject = '[Notification] Your pending Sales Order has been approved';
			var body = 'You may start adding Web Users for this contract<br/><br/>';
			body += '<strong>Contract : </strong> ' + contract_name + '<br/>';
			body += '<strong>Customer : </strong> ' + customer_name + '<br/>';
			body += '<strong>Sales Order No.: </strong> ' + doc_num + '<br/<br/>';
			body += 'You can access the record by <a href="https://system.na1.netsuite.com/app/accounting/transactions/salesord.nl?id='+ soid + '"> Clicking Here </a>';
			
			nlapiSendEmail(author, recipient, subject, body, null, null, records);
			
		}
	}
	var custid = nlapiGetFieldValue('entity');
	var ordtype = nlapiGetFieldValue('custbody_order_type');
	

	
	if (type == 'delete'){
		
		if (isNotEmpty(esid)){
			ordtype = nlapiLookupField('estimate',esid,'custbody_order_type');
			nlapiLogExecution('debug','39 ordtype '+ordtype);
			var opstatus = 8;
			if (ordtype == 2){
				opstatus = 133;
			}	
			if(isNotEmpty(opid)){
				var optranstatus = nlapiLookupField('opportunity',opid,'status');
				if (optranstatus != 'closedWon'){
					var opflds = ['entitystatus','custbody_ta_opportunity_status'];
					var opvals = [opstatus,3];
					nlapiSubmitField('opportunity',opid,opflds,opvals);
				}
			}
			nlapiSubmitField('estimate',esid,'entitystatus',opstatus);
		}
	}
	
	
	if (type=='create'){
		
		//Search for related new business records through created from field.
		
		if (isNotEmpty(esid)){
			var nbfils = [];
			nbfils.push(new nlobjSearchFilter('custrecord_newbus_txn',null,'anyof',esid));
			var nbResults = nlapiSearchRecord('customrecord_newbus',null,nbfils);
			if (isNotEmpty(nbResults)){
				for (var nb = 0; nb<nbResults.length;nb++){
					var nbid = nbResults[nb].getId();
					nlapiSubmitField('customrecord_newbus',nbid,'custrecord_newbus_txn',soid);
				}
			}
		}	
		if (ordtype == 2){
			var fromcontract = nlapiGetFieldValue('custbody_swe_from_contract');
			nlapiSubmitField('customrecord_contracts',fromcontract,'custrecord_contract_renewal_tran',soid);
			//var esid = nlapiGetFieldValue('createdfrom');
			// Set opid to 135 Renewal - Closed Won
			if (isNotEmpty(opid)){
				var opflds = ['entitystatus','custbody_ta_opportunity_status'];
				var opvals = [135,2];
				nlapiSubmitField('opportunity',opid,opflds,opvals);
			}
			var entitystatus = nlapiLookupField('customer', custid, 'entitystatus');
			if (entitystatus != 135)
				nlapiSubmitField('customer', custid, 'entitystatus',135);
		} else{
			if (isNotEmpty(opid)){
				var opflds = ['entitystatus','custbody_ta_opportunity_status'];
				var opvals = [13,2];
				nlapiSubmitField('opportunity',opid,opflds,opvals);
			}
		}
	}
}

function ccerp_update_coterm_contractitems_SCHED(){
	nlapiLogExecution('debug', 'Begin ccerp_update_coterm_contractitems_SCHED ');
	
	// Search for Co-Term Contract Items
	var soresults = nlapiSearchRecord(null, 'customsearch_ccerp__process_coterm_so');
	if (isNotEmpty(soresults)){
		var txntype = '';
		for (var i = 0; i < soresults.length; i++) {
			var txnid = soresults[i].getId();
			var ciid = soresults[i].getValue('custcol_cotermcontract_item');
			var txntypetxt = soresults[i].getText('type');
			if (txntypetxt == 'Sales Order')
				txntype = 'salesorder';
			else
				txttype = 'cashsale';
			//Submit has coterm item = T for contract
			var cid = soresults[i].getValue('custrecord_ci_contract_id','custcol_cotermcontract_item');
			var hascoterm = nlapiLookupField('customrecord_contracts',cid,'custrecord_hascotermitem');
			if (hascoterm != 'T')
				nlapiSubmitField('customrecord_contracts',cid,'custrecord_hascotermitem','T');
			
			// Submit Do Not Renew = T for all Results
			var cirec = nlapiLoadRecord('customrecord_contract_item',ciid);
			cirec.setFieldValue('custrecord_ci_renewals_exclusion','T');
			nlapiSubmitRecord(cirec);
			// Submit SO Co-Term Processed = T flag
			var socotermprocessed = nlapiLookupField(txntype, txnid, 'custbody_ccerp_cotermprocessed');
			if (socotermprocessed != 'T')
				nlapiSubmitField(txntype,txnid,'custbody_ccerp_cotermprocessed','T');
		}
	}
}

function ta_hourly_salesorder_SCHED() {
	nlapiLogExecution('DEBUG', 'ta_hourly_salesorder_SCHED', 'Script Begins');
	
	var searchFilter = [];
	searchFilter.push(new nlobjSearchFilter( 'nextbilldate', null, 'isnotempty' ));
	var searchResult = nlapiSearchRecord(null, 'customsearch580', searchFilter, null);
	
	if(isNotEmpty(searchResult)){
		for (var i = 0; i < searchResult.length; i++){
			var soId = searchResult[i].getId();
			sorec = nlapiLoadRecord('salesorder', soId);
			nlapiLogExecution('DEBUG', 'Log Status', sorec.getFieldValue('custbody_check_log_status'));
			sorec.getFieldValue('custbody_check_log_status') == '1' ? sorec.setFieldValue('custbody_check_log_status', '1'):sorec.setFieldValue('custbody_check_log_status', '2'); 
			nlapiSubmitRecord(sorec);
			nlapiLogExecution('DEBUG', 'ta_hourly_salesorder_SCHED', 'Updated Record - ' + soId);
		}
	}
	
}

function findAndUpdateFreeUser(req, res) {

	var datain = JSON.parse(req.getBody());
		
	var items = datain.items;
	var custId = datain.custId;
	var contractId = datain.contractId;
	
	nlapiLogExecution('DEBUG', 'SUITELET BEGINS');
	nlapiLogExecution('DEBUG', 'ITEMS', items);
	var usersToUpdate = nlapiSearchRecord('customrecord_contractuser', null, 
			[
			 ['custrecord_contractuser_customer', 'is', custId]
			 ,'AND',
			 ['custrecord_contractuser_freetrial', 'is', 'T']
			 ,'AND',
			 ['custrecord_contractuser_activeflag', 'is', 'T']
			]
		);

	if(usersToUpdate) {
		usersToUpdate.forEach(function(user) {
			var userRec = nlapiLoadRecord('customrecord_contractuser', user.getId());
			userRec.setFieldValue('custrecord_contractuser_freetrial', 'F');
			userRec.setFieldValues('custrecord_contractuser_items', items);
			userRec.setFieldValue('custrecord_contractuser_contract', contractId);
			var userId = nlapiSubmitRecord(userRec, null, 'T');
			nlapiLogExecution('DEBUG', 'User ID Submitte', userId);
		});
	}
}

