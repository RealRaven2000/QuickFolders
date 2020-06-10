	// -----------------------------------
	// Split addresses and change encoding.
	split : function (addrstr, charset, format)
	{
	  function getEmailAddress(a) {
			return a.replace(/.*<(\S+)>.*/g, "$1");
		}
		function isMail(format) { return (format.search(/^\(mail[\),]/, "i") != -1);};
		function isName(format) { return (format.search(/^\((first)*name[,\)]/, "i") != -1);};
		function isLink(format) { return SmartTemplate4.Util.isFormatLink(format);  /* this = regularize? */ };
		function isFirstName(format) { return (format.search(/^\(firstname[,\)]/, "i") != -1);};
		function isLastName(format) { return (format.search(/^\(lastname[,\)]/, "i") != -1);};
		
		SmartTemplate4.Util.logDebugOptional('mime','mimeDecoder.split()');
		// MIME decode
		addrstr = this.decode(addrstr, charset);
		// Escape "," in mail addresses
		addrstr = addrstr.replace(/"[^"]*"/g, function(s){ return s.replace(/%/g, "%%").replace(/,/g, "-%-"); });

		let array = addrstr.split(/\s*,\s*/);
		let addresses = "";
		let showName = false;
		let showMailAddress = false;
		let showLink = false;
		// difficult logic for format here... [makes it hard to extend format]
		// possible values for format are:
		// name
		// firstname
		// mail
		// => new: link -- e.g. %to(mail,link)%
		showName = isName(format);
		showMailAddress = isMail(format);
		showLink = isLink(format); 

		for (var i = 0; i < array.length; i++) {
			if (i > 0) {
				addresses += ", ";
			}

			// Escape "," in mail addresses
			array[i] = array[i].replace(/\r\n|\r|\n/g, "")
			                   .replace(/"[^"]*"/,
			                   function(s){ return s.replace(/-%-/g, ",").replace(/%%/g, "%"); });
			// name or/and address
			var address = array[i].replace(/^\s*([^<]\S+[^>])\s*$/, "<$1>").replace(/^\s*(\S+)\s*\((.*)\)\s*$/, "$2 <$1>");
			var result = "";
			
			if (showName) {
				// this cuts off the angle-bracket adress part: <foo@bar.com>
				result = address.replace(/\s*<\S+>\s*$/, "")
					              .replace(/^\s*\"|\"\s*$/g, "");  // %to% / %to(name)%
				if (result != "" && showMailAddress) {
					result += address.replace(/.*<(\S+)>.*/g, " <$1>");
				}     // %to%
			}
			if (result == "") {
				if (!showMailAddress) {
					result = address.replace(/.*<(\S+)@\S+>.*/g, "$1");
				}  // %to(name)%
				else {
					result = getEmailAddress(address); // email part ?
				}     // %to% / %to(mail)%
			}
			// swap last, first
			let nameProcessed = false;
			if (isName(format) &&  SmartTemplate4.Preferences.getMyBoolPref('firstLastSwap')) 
			{
			  // => add special test for x, y (name) pattern!
				// use this for the name and firstname case (but not for lastname)
				let regex = /\(([^)]+)\)/;
				let nameRes = regex.exec(result);
				if (nameRes 
				    && 
						nameRes.length > 1
						&&
						!isLastName(format)) {
					nameProcessed = true;
					result = nameRes[1];  // name or firstname will fetch the (Name) from brackets!
				}
				else {
					let iComma =  result.indexOf(', ');
					if (iComma>0) {
						let first = result.substr(iComma + 2);
						let last = result.substr(0, iComma);
						result = first + ' ' + last; // simple solution
					}
				}
			}
			
			if (!nameProcessed) {
				// get firstname  (result should hold name)
				let delimiter = '';
				if ((delimiter = format.match(/^\(firstname(\[.*\])*[,\)]/i)) != null) {  // [optional] second param is delimiter
					if (delimiter[1] == null) {
						delimiter[1] = "[., ]";
					}
					else {
						// this simply replaces , or . with a white space
						delimiter[1] = delimiter[1].replace(/&nbsp;/, " ");
					}
					// truncate after delimiter => first name
					result = result.replace(new RegExp(delimiter[1] + ".*"), "");
				}
			}

			if (showLink) {
				result = "<a href=mailto:" + getEmailAddress(address) + ">" + result + "</a>";
			}
			
			addresses += result;
		}
		return addresses;
	} // split
};