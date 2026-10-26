//%% example 1: types and conversion
{
const countText = "12";
const count = Number(countText);//%%converting a string to a number
const image = null;//%%empty value
console.log(typeof countText, typeof count);
console.log(count + 8, image === null);
console.log(Number.isNaN(Number("many")));//%%NaN stands for "Not-a-Number"  
}

//%% example 2 - branches and a loop
const titles = [" ","Hello","A".repeat(161)];//%% (Generates a string of 161 'A' characters repeated, length = 161).
for (const title of titles){
    if (title.trim().length === 0) console.log("blank");//%%trim() actually removes all whitespaces (spaces, tabs, newlines) from both ends of a string
    else if (title.length > 160) console.log("too long");
    else console.log("valid");
}//%%braces {} are used to mark the beginning and end of a code block

//%% example 3 - functions and return
function preview(title, length = 5){
    return title.trim().slice(0, length);
}
const normalize = (text) => text.trim().toLowerCase();
console.log(preview(" Python"));
console.log(normalize(" ADA "));

//%% example 4: Named module import
import {cleanTitle} from "./domain.js";
console.log(cleanTitle(" Hello "));
