const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

const router = express.Router();

router.get('/', async(req, res, next) => {
    try{
        const rooms = await Room.find({});
        res.render('main', {rooms, title: 'GIF 채팅방'});
    } catch(error) {
        console.error(error);
        next(error);
    }
});

router.get('/room', (req, res) => {
    res.render('room', {title: 'GIF 채팅방 생성'});
});

router.post('/room', async (req, res, next) => {
    console.log(req.session.color);
    try {
      const newRoom = await Room.create({
        title: req.body.title,
        max: req.body.max,
        owner: req.session.color,
        password: req.body.password,
      });
      const io = req.app.get('io');
      io.of('/room').emit('newRoom', newRoom);
      res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
    } catch (error) {
      console.error(error);
      next(error);
    }
  });

router.get('/room/:id', async(req, res, next) => {
    try{
        const room = await Room.findOne({_id: req.params.id});
        const io = req.app.get('io');
        if(!room){
            return res.redirect('/?error=존재하지 않는 방입니다.');
        }
        if(room.password && room.password !== req.query.password){
            return res.redirect('/?error=비밀번호가 틀렸습니다.');
        }
        const {rooms} = io.of('/chat').adapter; // 방 목록
        if(rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length){
            return res.redirect('/?error=허용 인원을 초과했습니다.');
        }
        const chats = await Chat.find({room: room._id}).sort('createdAt');
        return res.render('chat', {
            room,
            title: room.title,
            max: room.max,
            chats,
            user: req.session.color,
        });
    } catch(error) {
        console.error(error);
        return next(error);
    }
});

router.delete('/room/:id', async(req, res, next) => {
    try{
        await Room.remove({_id:req.params.id});
        await Chat.remove({room:req.params.id});
        res.send('ok');
        setTimeout(() => {
            req.app.get('io').of('/room').emit('removeRoom', req.params.id);
        }, 2000);
    }catch(error){
        console.error(error);
        next(error);
    }
});

router.post('/room/:id/chat', async (req, res, next) => {
  try{
      const chat = await Chat.create({
          room: req.params.id,
          user: req.session.color,
          chat: req.body.chat,
      });
      //req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
      req.app.get('io').of('/chat').to(req.params.id).emit('chat',{
        socket: req.body.sid,
        room: req.params.id,
        user: req.session.color,
        chat: req.body.chat,
      });
      console.log('chat id: '+ req.body.sid);
      res.send('ok');
  }catch(error){
      console.error(error);
      next(error);
  }
});

//number: app.get('io').of('/chat').adapter.rooms[req.params.id].length,
router.post('/room/:id/sys', async (req, res, next) => {
  const number = req.app.get('io').of('/chat').adapter.rooms[req.params.id].length;
  const msg = req.body.type === 'join' ? `${req.session.color}님이 입장하셨습니다. \n 현재 인원: ${number}`:`${req.session.color}님이 퇴장하셨습니다. \n 현재 인원: ${number}`;

  try{
      const chat = await Chat.create({
          room: req.params.id,
          user: 'system',
          chat: msg,
      });
      chat.save();
      req.app.get('io').of('/chat').to(req.params.id).emit(req.body.type, {
        user: 'system',
        chat: msg,
      });
      res.send('ok');
  }catch(error){
      console.error(error);
      next(error);
  }
});

router.post('/room/:id', async (req, res, next) => {
  try{
    const room = await Room.update({
      _id: req.params.id
    },{
      owner: req.body.newowner,
    })
    res.send('ok');
  } catch (e) {
    console.error(e);
    next(e);
  }
})

try {
    fs.readdirSync('uploads');
  } catch (err) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
  }
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, done) {
        done(null, 'uploads/');
      },
      filename(req, file, done) {
        const ext = path.extname(file.originalname);
        done(null, path.basename(file.originalname, ext) + Date.now() + ext);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
  });
  router.post('/room/:id/gif', upload.single('gif'), async (req, res, next) => {
    try {
      const chat = await Chat.create({
        room: req.params.id,
        user: req.session.color,
        gif: req.file.filename,
      });
      //req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
      req.app.get('io').of('/chat').to(req.params.id).emit('chat', {
        socket: req.body.sid,
        room: req.params.id,
        user: req.session.color,
        gif: req.file.filename,
      });
      res.send('ok');
    } catch (error) {
      console.error(error);
      next(error);
    }
  });

module.exports = router;