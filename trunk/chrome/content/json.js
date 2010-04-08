/*
Copyright (c) 2005 JSON.org

For original Permissions / EULA, please check json.org
USAGE:
   var o = JSON.parse(jsonStr);
   var s = JSON.stringify(obj);

// If there is an error, the method calls _root.debug("Error message...")
// Override JSON.error for the desired behaviour
*/

// AG 22/09/09 added return values to avoid JS warnings "function does not always return a value"

var JSON = new Object();

JSON.error = new function(msg) {
	JSON.error_occured = true;
}

JSON.stringify = function (arg) {
   var c, i, l, s = '', v;
   JSON.error_occured = false;

   switch (typeof arg) {
   case 'object':
	   if (arg) {
		   if (arg instanceof Array) {
			   for (i = 0; i < arg.length; ++i) {
				   v = JSON.stringify(arg[i]);
				   if (s) {
					   s += ',';
				   }
				   s += v;
			   }
			   return '[' + s + ']';
		   } else if (typeof arg.toString != 'undefined') {
			   for (i in arg) {
				   v = arg[i];
				   if (typeof v != 'undefined' && typeof v != 'function') {
					   v = JSON.stringify(v);
					   if (s) {
						   s += ',';
					   }
					   s += JSON.stringify(i) + ':' + v;
				   }
			   }
			   return '{' + s + '}';
		   }
	   }
	   return 'null';
   case 'number':
	   return isFinite(arg) ? String(arg) : 'null';
   case 'string':
	   l = arg.length;
	   s = '"';
	   for (i = 0; i < l; i += 1) {
		   c = arg.charAt(i);
		   if (c >= ' ') {
			   if (c == '\\' || c == '"') {
				   s += '\\';
			   }
			   s += c;
		   } else {
			   switch (c) {
				   case '\b':
					   s += '\\b';
					   break;
				   case '\f':
					   s += '\\f';
					   break;
				   case '\n':
					   s += '\\n';
					   break;
				   case '\r':
					   s += '\\r';
					   break;
				   case '\t':
					   s += '\\t';
					   break;
				   default:
					   c = c.charCodeAt();
					   s += '\\u00' + Math.floor(c / 16).toString(16) +
						   (c % 16).toString(16);
			   }
		   }
	   }
	   return s + '"';
   case 'boolean':
	   return String(arg);
   default:
	   return 'null';
   }
}



JSON.parse = function (text) {
   var at = 0;
   var ch = ' ';
   JSON.error_occured = false;


   function error(m) {
	   JSON.error("JSONError: "+m)
   }

   function next() {
	   ch = text.charAt(at);
	   at += 1;
	   return ch;
   }

   function white() {
	   while (!JSON.error_occured && ch != null) {
		   if (ch <= ' ') {
			   next();
		   } else if (ch == '/') {
			   switch (next()) {
				   case '/':
					   while (!JSON.error_occured && next() != null && ch != '\n' && ch != '\r') {}
					   break;
				   case '*':
					   next();
					   while (true) {
						   if (ch) {
							   if (ch == '*') {
								   if (next() == '/') {
									   next();
									   break;
								   }
							   } else {
								   next();
							   }
						   } else {
							   error("Unterminated comment");
						   }
					   }
					   break;
				   default:
					   error("Syntax error");
			   }
		   } else {
			   break;
		   }
	   }
   }

   function str() {
	   var i, s = '', t, u;
	   var outer = false;

	   if (ch == '"') {
		   while (!JSON.error_occured && next() != null) {
			   if (ch == '"') {
				   next();
				   return s;
			   } else if (ch == '\\') {
				   switch (next()) {
				   case 'b':
					   s += '\b';
					   break;
				   case 'f':
					   s += '\f';
					   break;
				   case 'n':
					   s += '\n';
					   break;
				   case 'r':
					   s += '\r';
					   break;
				   case 't':
					   s += '\t';
					   break;
				   case 'u':
					   u = 0;
					   for (i = 0; i < 4; i += 1) {
						   t = parseInt(next(), 16);
						   if (!isFinite(t)) {
							   outer = true;
							   break;
						   }
						   u = u * 16 + t;
					   }
					   if(outer) {
						   outer = false;
						   break;
					   }
					   s += String.fromCharCode(u);
					   break;
				   default:
					   s += ch;
				   }
			   } else {
				   s += ch;
			   }
		   }
	   }
	   error("Bad string");
	   return null;
   }

   function arr() {
	   var a = [];

	   if (ch == '[') {
		   next();
		   white();
		   if (ch == ']') {
			   next();
			   return a;
		   }
		   while (!JSON.error_occured && ch != null) {
			   a.push(value());
			   white();
			   if (ch == ']') {
				   next();
				   return a;
			   } else if (ch != ',') {
				   break;
			   }
			   next();
			   white();
		   }
	   }
	   error("Bad array");
	   return null;
   }

   function obj() {
	   var k, o = {};

	   if (ch == '{') {
		   next();
		   white();
		   if (ch == '}') {
			   next();
			   return o;
		   }
		   while (!JSON.error_occured && ch != null) {
			   k = str();
			   white();
			   if (ch != ':') {
				   break;
			   }
			   next();
			   o[k] = value();
			   white();
			   if (ch == '}') {
				   next();
				   return o;
			   } else if (ch != ',') {
				   break;
			   }
			   next();
			   white();
		   }
	   }
	   error("Bad object");
	   return null;
   }

   function num() {
	   var n = '', v;

	   if (ch == '-') {
		   n = '-';
		   next();
	   }
	   while (!JSON.error_occured && ch >= '0' && ch <= '9') {
		   n += ch;
		   next();
	   }
	   if (ch == '.') {
		   n += '.';
		   next();
		   while (!JSON.error_occured && ch >= '0' && ch <= '9') {
			   n += ch;
			   next();
		   }
	   }
	   if (ch == 'e' | ch == 'E') {
		   n += ch;
		   next();
		   if (ch == '-' || ch == '+') {
			   n += ch;
			   next();
		   }
		   while (!JSON.error_occured && ch >= '0' && ch <= '9') {
			   n += ch;
			   next();
		   }
	   }
	   v = Number(n);
	   if (!isFinite(v)) {
		   error("Bad number");
	   }
	   return v;
   }

   function word() {
	   switch (ch) {
		   case 't':
			   if (next() == 'r' && next() == 'u' &&
					   next() == 'e') {
				   next();
				   return true;
			   }
			   break;
		   case 'f':
			   if (next() == 'a' && next() == 'l' &&
					   next() == 's' && next() == 'e') {
				   next();
				   return false;
			   }
			   break;
		   case 'n':
			   if (next() == 'u' && next() == 'l' &&
					   next() == 'l') {
				   next();
				   return null;
			   }
			   break;
	   }
	   error("Syntax error");
	   return null;
   }

   function value() {
	   white();
	   switch (ch) {
		   case '{':
			   return obj();
		   case '[':
			   return arr();
		   case '"':
			   return str();
		   case '-':
			   return num();
		   default:
			   return ch >= '0' && ch <= '9' ? num() : word();
	   }
   }

   return value();
}


