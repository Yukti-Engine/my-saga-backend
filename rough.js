
const encode = (text) => {
    return Buffer.from(text, "utf8").toString("base64");
  };

console.log(encode("Babycorn"));