var io = require('socket.io')(process.env.PORT || 3000);
var shortid = require('shortid');

var Rooms = [];
var Playrer_in_Room = [];
console.log("server started");
var Player_Counter = 0;
io.on('connection', function(socket)
{


	var thisclaintId = shortid.generate();
	console.log('clienttt connected with Id :', thisclaintId);
	socket.emit("open", { id : thisclaintId});
	socket.on("createroom", function(data){
		//if  exist data.name do send error
		function checkexist(room) {
    		return room == data.name;
		}
		if (Rooms.find(checkexist)) {
			socket.emit("room_exist", {id:thisclaintId})
		}
		//else if data.name not exist do create room
		else{
			socket.join(data.name);
			console.log("roome is created with name : " + JSON.stringify(data.name));
			Rooms.push(data.name);
			socket.emit("spawn_hoster" ,{room : data.name, id:thisclaintId});
			Playrer_in_Room.push({
				key: data.name,
				number: 1,
				id : [thisclaintId]
			});
		}


	});
	socket.on("jointoroom", function(data){
		function checkexist(room) {
    		return room == data.name;
			}
		function findroomname(room) {
		    return data.name == room.key;
		}
		//if  exist this data.name do spawn joiner

		if (Rooms.find(checkexist)) {
			var number_of_room = Playrer_in_Room.find(findroomname).number;
			if (number_of_room >= 4) {
				socket.emit("room_is_full", {id : thisclaintId});
			}
			else {
				socket.join(data.name);
				socket.in(data.name).emit("spawn_joiner", {room: data.name, id: thisclaintId});
				//socket.in(data.name).emit("requestposition", {room : data.name});
				console.log("the claint with " + thisclaintId + " joined to the " + data.name);
				number_of_room = (++Playrer_in_Room.find(findroomname).number);
				Playrer_in_Room.find(findroomname).id.push(thisclaintId);
				console.log("number of player in " + data.name + " is " + number_of_room);
				Playrer_in_Room.find(findroomname).id.forEach(function(playerId){
					if (thisclaintId == playerId) {
							return;
					}
					socket.emit("otherspawn", {id: playerId, room:data.name});
				});

			}
		}
		//else if dadta.name not exist do send error
		else{
			socket.emit("room_not_exist", {room : data.name});
		}


	});
	///socket.on("updateposition", function(data){
	///	console.log("update position ", data);
	////	data.id = thisclaintId;
	//	socket.in(data.room).emit("updateposition", data);

	//});


});
