package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.NpcDTO;
import com.giulia.dndacademy.dto.NpcRequest;
import com.giulia.dndacademy.service.NpcService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/npcs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MASTER')")
public class NpcController {

    private final NpcService npcService;

    @PatchMapping("/{npcId}/image")
    public NpcDTO uploadNpcImage(@PathVariable Long npcId,
                                 @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
                                 Authentication authentication) {
        return npcService.uploadNpcImage(npcId, file, authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NpcDTO createNpc(
            @RequestBody @Valid NpcRequest request,
            Authentication authentication
    ) {
        return npcService.createNpc(
                request,
                authentication.getName()
        );
    }

    @GetMapping
    public List<NpcDTO> getMyNpcs(Authentication authentication) {

        return npcService.getMyNpcs(authentication.getName());
    }

    @GetMapping("/{npcId}")
    public NpcDTO getNpcById(
            @PathVariable Long npcId,
            Authentication authentication
    ) {
        return npcService.getNpcById(
                npcId,
                authentication.getName()
        );
    }

    @PutMapping("/{npcId}")
    public NpcDTO updateNpc(
            @PathVariable Long npcId,
            @RequestBody @Valid NpcRequest request,
            Authentication authentication
    ) {
        return npcService.updateNpc(
                npcId,
                request,
                authentication.getName()
        );
    }

    @DeleteMapping("/{npcId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNpc(
            @PathVariable Long npcId,
            Authentication authentication
    ) {
        npcService.deleteNpc(
                npcId,
                authentication.getName()
        );
    }
}
