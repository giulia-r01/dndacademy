package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CampaignChapterDTO;
import com.giulia.dndacademy.dto.CreateCampaignChapterRequest;

import java.util.List;

public interface CampaignChapterService {

    CampaignChapterDTO createChapter(
            Long campaignId,
            CreateCampaignChapterRequest request,
            String username
    );

    List<CampaignChapterDTO> getChaptersByCampaign(
            Long campaignId,
            String username
    );

    CampaignChapterDTO updateChapter(
            Long chapterId,
            CreateCampaignChapterRequest request,
            String username
    );

    void deleteChapter(
            Long chapterId,
            String username
    );
}