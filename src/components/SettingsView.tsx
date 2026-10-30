import React, { useState } from 'react';
import {
  Settings,
  Upload,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Palette,
  ShieldCheck,
  Video,
  Share2,
  Tv,
  ExternalLink,
} from 'lucide-react';
import { StudioSettings } from '../types/news';
import { api } from '../services/api';

interface SettingsViewProps {
  settings: StudioSettings;
  onUpdateSettings: (newSettings: StudioSettings) => void;
  language: 'te' | 'en';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  language,
}) => {
  const [formData, setFormData] = useState<StudioSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);

  const handleAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'landscape_frame' | 'vertical_frame'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAsset(type);
    try {
      const res = await api.uploadBrandAsset(file, type);
      if (type === 'logo') setFormData((p) => ({ ...p, logoUrl: res.url }));
      if (type === 'landscape_frame') setFormData((p) => ({ ...p, landscapeFrameUrl: res.url }));
      if (type === 'vertical_frame') setFormData((p) => ({ ...p, verticalFrameUrl: res.url }));
      alert(`${type} అప్‌లోడ్ విజయవంతం!`);
    } catch (err: any) {
      alert(err.message || 'Asset upload failed');
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMsg('');

    try {
      const res = await api.saveSettings(formData);
      onUpdateSettings(res.settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#141d2e] via-[#0f172a] to-[#111927] border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg lg:text-xl font-black text-white font-telugu flex items-center gap-2">
              స్టూడియో సెట్టింగ్స్ &amp; బ్రాండింగ్ మేనేజ్‌మెంట్
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Logos, TV Frames, Meta Facebook Graph API &amp; X/Twitter Credentials
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold font-telugu">
          <CheckCircle2 className="w-4 h-4" />
          <span>సెట్టింగ్స్ విజయవంతంగా భద్రపరచబడ్డాయి! (Settings saved successfully)</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold font-telugu">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Channel Branding & Identity */}
        <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Tv className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu">
              ఛానల్ గుర్తింపు &amp; రంగులు (Channel Identity &amp; Colors)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Channel Name (English)
              </label>
              <input
                type="text"
                value={formData.channelName}
                onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                ఛానల్ పేరు (తెలుగు)
              </label>
              <input
                type="text"
                value={formData.channelNameTelugu}
                onChange={(e) => setFormData({ ...formData, channelNameTelugu: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-telugu focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                ట్యాగ్‌లైన్ (Tagline)
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-telugu focus:border-red-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                  ప్రైమరీ రంగు (Primary Red)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{formData.primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1 font-telugu">
                  యాసెంట్ రంగు (Accent Gold)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-8 h-8 rounded-lg bg-transparent border border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{formData.accentColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Logo and Video Frames Uploader */}
        <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Upload className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu">
              లోగో &amp; వీడియో ఫ్రేమ్‌ల అప్‌లోడ్ (Logos &amp; Video Frames)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Logo Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 font-telugu block">
                  ప్రజా సంకేతం లోగో (Logo)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  PNG / SVG Transparent Logo
                </p>
                <div className="my-3 h-16 bg-slate-950 rounded-lg flex items-center justify-center p-2 border border-slate-800">
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <label className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {uploadingAsset === 'logo' ? 'అప్‌లోడ్...' : 'కొత్త లోగో మార్చండి'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload(e, 'logo')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Landscape Frame Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 font-telugu block">
                  16:9 ల్యాండ్‌స్కేప్ ఫ్రేమ్ (Landscape 16:9)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  1920x1080 Broadcast TV Frame
                </p>
                <div className="my-3 h-16 bg-slate-950 rounded-lg flex items-center justify-center p-2 border border-slate-800">
                  <img
                    src={formData.landscapeFrameUrl}
                    alt="Landscape Frame"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <label className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {uploadingAsset === 'landscape_frame' ? 'అప్‌లోడ్...' : 'కొత్త 16:9 ఫ్రేమ్ మార్చండి'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload(e, 'landscape_frame')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Vertical Frame Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 font-telugu block">
                  9:16 వర్టికల్ ఫ్రేమ్ (Vertical 9:16)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  1080x1920 Shorts &amp; Reels Frame
                </p>
                <div className="my-3 h-16 bg-slate-950 rounded-lg flex items-center justify-center p-2 border border-slate-800">
                  <img
                    src={formData.verticalFrameUrl}
                    alt="Vertical Frame"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <label className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {uploadingAsset === 'vertical_frame' ? 'అప్‌లోడ్...' : 'కొత్త 9:16 ఫ్రేమ్ మార్చండి'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload(e, 'vertical_frame')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Facebook Publishing Credentials (Meta Graph API) */}
        <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu">
                మెటా ఫేస్‌బుక్ అధికారిక API కాన్ఫిగరేషన్ (Meta Graph API)
              </h3>
            </div>
            <a
              href="https://developers.facebook.com/tools/explorer/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Meta Graph Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Facebook Page ID
              </label>
              <input
                type="text"
                value={formData.metaConfig.pageId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metaConfig: { ...formData.metaConfig, pageId: e.target.value },
                  })
                }
                placeholder="e.g. 104829104829104"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Page Display Name
              </label>
              <input
                type="text"
                value={formData.metaConfig.pageName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metaConfig: { ...formData.metaConfig, pageName: e.target.value },
                  })
                }
                placeholder="e.g. Praja Sanketam News Official"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Page Access Token (Permanent / Long-Lived Token)
              </label>
              <input
                type="password"
                value={formData.metaConfig.pageAccessToken}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metaConfig: { ...formData.metaConfig, pageAccessToken: e.target.value },
                  })
                }
                placeholder="EAAB... (Server-side secret, securely encrypted)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Required permissions on token: pages_manage_posts, pages_read_engagement, publish_video.
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: X/Twitter API Configuration */}
        <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu">
                X / Twitter API v2 క్రెడెన్షియల్స్ (Official X API)
              </h3>
            </div>
            <a
              href="https://developer.x.com/en/portal/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>X Developer Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              X API Bearer Token (v2)
            </label>
            <input
              type="password"
              value={formData.xConfig.bearerToken}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  xConfig: { ...formData.xConfig, bearerToken: e.target.value },
                })
              }
              placeholder="AAAAAAAAAAAAAAAAAAAAA... (Server-side secret)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none font-mono"
            />
          </div>
        </div>

        {/* Section 5: Video Output Quality */}
        <div className="bg-[#0f1624] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Video className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-telugu">
              వీడియో ఎక్స్‌పోర్ట్ నాణ్యత (FFmpeg Video Quality)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Resolution
              </label>
              <select
                value={formData.renderQuality}
                onChange={(e) =>
                  setFormData({ ...formData, renderQuality: e.target.value as any })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="1080p">1080p Full HD (1920x1080 / 1080x1920)</option>
                <option value="720p">720p HD (1280x720 / 720x1280)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Frame Rate (FPS)
              </label>
              <select
                value={formData.fps}
                onChange={(e) =>
                  setFormData({ ...formData, fps: parseInt(e.target.value, 10) as any })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value={30}>30 FPS (Standard Television)</option>
                <option value={60}>60 FPS (High Motion Smooth)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Form Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-red-950/60 cursor-pointer transition-all"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>భద్రపరుస్తోంది...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-amber-300" />
                <span className="font-telugu">సెట్టింగ్స్ భద్రపరచండి (Save Studio Settings)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
