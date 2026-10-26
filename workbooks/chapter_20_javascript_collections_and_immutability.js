//%%example 1 - read object fields
const post = {id:1, title:"Hello", image:null};
const{title} = post;
console.log(title, post.author?.email ?? "Unknown");//%%The ?. operator is called Optional Chaining. It allows JavaScript to read nested properties safely without crashing your program if a property doesn't exist.

//%%example 2 - map,filter and find
//%%const posts = [{id:1, title:"Python"},{id:2, title: "CSS"}];
console.log(posts.map((p) => p.title));
console.log(posts.filter((p) => p.title.toLowerCase().includes("py")).length);
console.log(posts.find((p) => p.id === 99));//%%Default return: When .find() fails to find a match, it directly returns the primitive value undefined (instead of an empty array []).

//%%example 3 - spread copies (zarul cakap nanti try test if delete .. jadi apa, start error kat sini nnti kita fix)
const original = {id: 1, title: "Old"};
const draft = {...original, title: "New"};
const posts = [original];
const next = [...posts, {id:2, title: "Added"}];
console.log(original.title, draft.title, posts.length, next.length);

//%%example 4 - update and delete by ID

