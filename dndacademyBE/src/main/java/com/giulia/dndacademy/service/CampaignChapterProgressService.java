package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CampaignChapterProgressDTO;

import java.util.List;

public interface CampaignChapterProgressService {

    List<CampaignChapterProgressDTO> getProgressByCampaign(
            Long campaignId,
            String username
    );

    CampaignChapterProgressDTO completeChapter(
            Long chapterId,
            String username
    );
}