import * as settingService from '../services/setting.service.js';
import { sendSuccess } from '../utils/response.js';

export const getSettings = async (req, res, next) => {
  try {
    const data = await settingService.getSettingsForUser(req.user);
    return sendSuccess(res, 200, 'Settings retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (req, res, next) => {
  try {
    const { scope, key } = req.params;
    const { value } = req.body;

    const updated = await settingService.updateSetting(req.user, {
      scope: scope.toUpperCase(),
      key,
      value,
    });

    return sendSuccess(res, 200, `Setting '${key}' saved successfully`, updated);
  } catch (error) {
    next(error);
  }
};

export default {
  getSettings,
  updateSetting,
};
