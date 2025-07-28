
const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
};



socket = io("");


let RTCPeersConnections = {}


// 1 - ask for user media and join the call
const call_id = '672507a9-8a38-4d38-a0e7-c33ca0d2f42f';
let objectStream;
navigator.mediaDevices.getUserMedia({video:false,audio:true}).then((stream) => {
  objectStream = stream
  socket.emit("join-call",call_id)
})




// 2 - notify every others socket about the new socket joing the call
socket.on("new-socket",socket_id => {
    // 3 - every socket in the call will create new RTCpeer connection to communicate with the new socket
      CreateRTCpeer(socket_id,true)
})




// 5 - the new socket recive the offer from all the peers and create RTCpeer connection for each of them , (to set setRemoteDescription)
socket.on("recive-offer",async data => {
    CreateRTCpeer(data.from,false)
    const pc = RTCPeersConnections[data.from]
    await pc.setRemoteDescription(data.offer)
  
    // 6 - send sdp answer to each peer that send the sdp offer
    pc.createAnswer().then((answer) => {
      pc.setLocalDescription(answer)
      socket.emit("answer",{"to":data.from,"answer":answer})
    })
})




socket.on("recive-answer",async data => {
    const pc = RTCPeersConnections[data.from]
    await pc.setRemoteDescription(data.answer)
  
})



  
socket.on("recive-icecandidate",async data => {
  const pc = RTCPeersConnections[data.from]
  await pc.addIceCandidate(data.candidate)
})






const CreateRTCpeer = (socket_id,Isofferer) => {
    const pc = new RTCPeerConnection(configuration)
    RTCPeersConnections[socket_id] = pc
  
  // Send your mic
  objectStream.getTracks().forEach(t => pc.addTrack(t, objectStream));

  // 🔊  NEW — play what we receive
  pc.ontrack = ({ streams: [remote] }) => {
    let audio = document.getElementById(socket_id);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = socket_id;
      audio.className = 'remote';     
      audio.autoplay = true;        // most browsers allow autoplay for WebRTC
      audio.playsInline = true;     // iOS
      document.body.appendChild(audio);
    }
    audio.srcObject = remote;
    audio.muted = remoteMuted;     
  };

    
  
    if(Isofferer){
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer)
        // 4 - send the offer to the new socket
        socket.emit("offer",{"to":socket_id,"offer":offer})
      })
    }
  
    // 7 - exchange icecandidate between the new peer and other peers
    pc.onicecandidate = event => {
      if(event.candidate){
        socket.emit("icecandidate",{"to":socket_id,"candidate":event.candidate})
      }
    }
  
  }




