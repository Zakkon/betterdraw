export const findWithAttr = (array, attr:string, value) => {
    if(array == undefined){return -1;}
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) { return i;}
    }
    return -1;
}
export const sortAlphabetically = (strArray, inverse:boolean = false) =>{

}