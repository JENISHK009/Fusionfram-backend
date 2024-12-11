import axios from 'axios';

const API_BASE_URL = 'https://modelslab.com/api/v6';
const API_KEY = process.env.MODELSLAB_API_KEY;

export const callExternalApi = async (endpoint, payload) => {
    try {
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
            key: API_KEY,
            ...payload
        });
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('API call error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'API call failed'
        };
    }
};

export const imageEditingService = {
    removeObject: (initImage, maskImage, trackId = null, webhook = null) => {
        return callExternalApi('/image_editing/object_removal', {
            init_image: initImage,
            mask_image: maskImage,
            track_id: trackId,
            webhook: webhook
        });
    },

    inpaintImage: (params) => {
        const {
            modelId,
            prompt,
            negativePrompt,
            width,
            height,
            samples,
            steps,
            safetyChecker,
            safetyCheckerType,
            enhancePrompt,
            enhanceStyle,
            guidanceScale,
            tomesd,
            useKarrasSigmas,
            algorithmType,
            strength,
            seed,
            clipSkip,
            temp,
            loraModel,
            initImage,
            maskImage,
            scheduler
        } = params;

        return callExternalApi('/images/inpaint', {
            model_id: modelId,
            prompt,
            negative_prompt: negativePrompt,
            width,
            height,
            samples,
            steps,
            safety_checker: safetyChecker,
            safety_checker_type: safetyCheckerType,
            enhance_prompt: enhancePrompt,
            enhance_style: enhanceStyle,
            guidance_scale: guidanceScale,
            tomesd,
            use_karras_sigmas: useKarrasSigmas,
            algorithm_type: algorithmType,
            strength,
            seed,
            clip_skip: clipSkip,
            temp,
            lora_model: loraModel,
            init_image: initImage,
            mask_image: maskImage,
            scheduler
        });
    }
};
