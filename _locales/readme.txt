Translation for this Add-on was permanently moved from the outdated Babelzilla.org to github.com:
https://github.com/RealRaven2000/QuickFolders/tree/ESR91/_locales


In order to add your own language, just download the English file:

https://github.com/RealRaven2000/QuickFolders/blob/ESR91/_locales/en/messages.json

All that needs to be translated are the "message" parts (no need to change anything in placeholders and description entries)

You cannot use ordinary double quotes " within the message, use single quotes or other quotation marks instead.

Whatever is between $$ or { } signs should be left alone - these are variables that I need to replace later.

Example:

"You are now running {boldStart} version $addonVer$ {boldEnd} on Thunderbird $appVer$."

My script replaces that later with

"You are now running <b> version 5.9 </b> on Thunderbird 91.5.1."

So you would have only translated the remaining readable words above. Also, if you see "QuickFolders and "QuickFolders Pro" do not translate these terms as they are "product names". Everything else is fair game.

Finally, there is are 2 entries that I regularly have to update when I release new versions of QuickFolders, which are:

'whats-new-list' - this is a bullet point list of the most important changes in the new version. I am using a pair of {L1}...content of the item goes here...{L2} for each point which I replace with the HTML code <li>  .. </li> . So again do not modify the {L1} and {L2} parts.

"special-offer-expiry" - this is the date when I schedule cheaper licenses on the online shop to encourage some sales.

====

to submit the new locale either create a PR (pull request) and generate the new locale folder with the translated messages.json or send it to me directly (axel.grude@gmail.com) and I can add it for you.
