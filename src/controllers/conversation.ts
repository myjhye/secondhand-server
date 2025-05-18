import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import ConversationModel from "src/models/conversation";
import UserModel from "src/models/user";
import { sendErrorRes } from "src/utils/helper";

// 대화방 조회 또는 생성 (participantsId로 기존 대화방이 있으면 그걸 리턴하고, 없으면 participants 정보를 넣어서 새로 만들어서 리턴)
export const getOrCreateConversation: RequestHandler = async (req, res) => {
    
    // 1. 상대방 ID(peerId) 받기
    const { peerId } = req.params;

    // 2. ID 형식이 맞는지 확인(MongoDB ID처럼 생겼는지 확인)
    if (!isValidObjectId(peerId)) {
        return sendErrorRes(res, "Invalid peer id!", 422);
    }

    // 3. 상대방 유저가 실제로 존재하는지 확인(없는 사람한테 대화 걸면 안 되니까 체크)
    const user = await UserModel.findById(peerId);
    if (!user) {
        return sendErrorRes(res, "User not found!", 404);
    }

    // 4. 대화방 고유 키 만들기(두 사람의 ID를 정렬해서 "유저A_유저B" 형태의 대화방 ID 만들기) -> 정렬하는 이유? (A-B, B-A 순서가 달라도 같은 방으로 인식 위해)
    const participants = [req.user.id, peerId];
    const participantsId = participants.sort().join("_");

    // 5. 대화방 찾기 or 만들기
    const conversation = await ConversationModel.findOneAndUpdate(
        { 
            participantsId // participantsId가 이거인 대화방을 찾아줘
        },
        {
            $setOnInsert: { // 만약 대화방이 없어서 새로 만들 경우, 이 값들로 insert 해
                participantsId,
                participants,
            },
        },
        {
            upsert: true, // 찾은 문서가 없으면 insert를 자동으로 해라
            new: true // 기존 문서를 찾았든, 새로 만들었든 최신 걸 리턴 해
        }
    );

    // 6. 응답으로 대화방 ID 보내기(프론트에서 이 대화방 ID를 이용해 메시지를 보내거나 불러올 수 있게 함)
    res.json({
        conversationId: conversation._id
    });

}   