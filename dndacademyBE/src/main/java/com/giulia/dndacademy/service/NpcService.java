package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.NpcDTO;
import com.giulia.dndacademy.dto.NpcRequest;

import java.util.List;

public interface NpcService {

    NpcDTO createNpc(NpcRequest request, String username);

    List<NpcDTO> getMyNpcs(String username);

    NpcDTO getNpcById(Long npcId, String username);

    NpcDTO updateNpc(Long npcId, NpcRequest request, String username);

    void deleteNpc(Long npcId, String username);

    NpcDTO uploadNpcImage(Long npcId, org.springframework.web.multipart.MultipartFile file, String username);
}
