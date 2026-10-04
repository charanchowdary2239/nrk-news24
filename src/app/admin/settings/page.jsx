'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { 
  Save, 
  Settings, 
  Bot, 
  Clock, 
  Shield, 
  Share2, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Key,
  Globe,
  Loader2 
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form states
  const [siteName, setSiteName] = useState('');
  const [siteTagline, setSiteTagline] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [defaultAuthor, setDefaultAuthor] = useState('');
  const [cronEnabled, setCronEnabled] = useState(true);
  const [cronFrequency, setCronFrequency] = useState('30');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');

  // Ad slot toggles
  const [adsTopBanner, setAdsTopBanner] = useState(true);
  const [adsSidebar, setAdsSidebar] = useState(true);
  const [adsArticle, setAdsArticle] = useState(true);
  const [adsFooter, setAdsFooter] = useState(true);

  // Social links
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [youtube, setYoutube] = useState('');

  // Admin Profile & Security
  const [adminName, setAdminName] = useState('NRK Editor');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const headers = {};
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/settings', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.settings || {};
        setSettings(s);
        setSiteName(s.site_name || 'NRK News24');
        setSiteTagline(s.site_tagline || '');
        setSiteDescription(s.site_description || '');
        setDefaultAuthor(s.default_author || 'NRK Bureau');
        setCronEnabled(s.cron_enabled === 'true');
        setCronFrequency(s.cron_frequency || '30');
        setAiModel(s.ai_model || 'gemini-1.5-flash');

        setAdsTopBanner(s.ads_top_banner_enabled !== 'false');
        setAdsSidebar(s.ads_sidebar_enabled !== 'false');
        setAdsArticle(s.ads_article_enabled !== 'false');
        setAdsFooter(s.ads_footer_enabled !== 'false');

        setTwitter(s.social_twitter || '');
        setFacebook(s.social_facebook || '');
        setTelegram(s.social_telegram || '');
        setWhatsapp(s.social_whatsapp || '');
        setYoutube(s.social_youtube || '');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setSaving(true);

    const payload = {
      site_name: siteName,
      site_tagline: siteTagline,
      site_description: siteDescription,
      default_author: defaultAuthor,
      cron_enabled: cronEnabled ? 'true' : 'false',
      cron_frequency: cronFrequency,
      ai_model: aiModel,
      ads_top_banner_enabled: adsTopBanner ? 'true' : 'false',
      ads_sidebar_enabled: adsSidebar ? 'true' : 'false',
      ads_article_enabled: adsArticle ? 'true' : 'false',
      ads_footer_enabled: adsFooter ? 'true' : 'false',
      social_twitter: twitter,
      social_facebook: facebook,
      social_telegram: telegram,
      social_whatsapp: whatsapp,
      social_youtube: youtube,
      admin_name: adminName,
      new_password: newPassword || undefined,
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = typeof window !== 'undefined' ? localStorage.getItem('nrk_admin_token') : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Configuration and security settings updated successfully.' });
        setNewPassword('');
        setConfirmPassword('');
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Communication error.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader title="Platform Settings & Configuration" onRefresh={fetchSettings} />

      <main className="p-6 max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-xs text-slate-500">
            Configure site branding, AI engine parameters, automated cron frequency, and ad slots
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded text-xs flex items-center ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-red-50 border border-red-300 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0b2545] mb-2" />
            Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. General Branding */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200 flex items-center">
                <Globe className="w-4 h-4 mr-1.5 text-[#0b2545]" />
                Brand & Publication Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Website Name
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Editorial Tagline
                  </label>
                  <input
                    type="text"
                    value={siteTagline}
                    onChange={(e) => setSiteTagline(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Editorial Description (SEO & Social Cards)
                </label>
                <textarea
                  rows={2}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Default Article Author
                </label>
                <input
                  type="text"
                  value={defaultAuthor}
                  onChange={(e) => setDefaultAuthor(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                />
              </div>
            </div>

            {/* 2. Automated Ingestion & AI Engine */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200 flex items-center">
                <Bot className="w-4 h-4 mr-1.5 text-red-600" />
                AI Pipeline & Scheduled Ingestion
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Automatic News Collection Frequency
                  </label>
                  <select
                    value={cronFrequency}
                    onChange={(e) => setCronFrequency(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:border-[#0b2545]"
                  >
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes (Recommended)</option>
                    <option value="60">Every 1 hour</option>
                    <option value="180">Every 3 hours</option>
                    <option value="360">Every 6 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    AI Processing Model
                  </label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:border-[#0b2545]"
                  >
                    <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Ultra-fast & cost-effective)</option>
                    <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Automated Background Cron Status:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cronEnabled}
                      onChange={(e) => setCronEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="text-[11px] text-slate-500">
                  <strong>AI API Key Status:</strong>{' '}
                  {settings.has_system_ai_key ? (
                    <span className="text-emerald-700 font-bold">
                      ✓ Active (Configured via AI_API_KEY environment variable)
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">
                      ℹ Fallback Mode Active (Using built-in intelligent editorial transformer; set AI_API_KEY in .env for Gemini API)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Advertisement Slots Configuration */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200 flex items-center">
                <Sliders className="w-4 h-4 mr-1.5 text-[#0b2545]" />
                Advertisement Space Slots
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Top Header Banner (728×90)</div>
                    <div className="text-[10px] text-slate-500">Leaderboard slot below Breaking Ticker</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={adsTopBanner}
                    onChange={(e) => setAdsTopBanner(e.target.checked)}
                    className="w-4 h-4 text-[#0b2545] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Sidebar Rectangle (300×250)</div>
                    <div className="text-[10px] text-slate-500">Displayed alongside Trending stories</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={adsSidebar}
                    onChange={(e) => setAdsSidebar(e.target.checked)}
                    className="w-4 h-4 text-[#0b2545] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                  <div>
                    <div className="text-xs font-bold text-slate-800">In-Article Banner</div>
                    <div className="text-[10px] text-slate-500">Positioned inside story reading view</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={adsArticle}
                    onChange={(e) => setAdsArticle(e.target.checked)}
                    className="w-4 h-4 text-[#0b2545] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Footer Large Leaderboard</div>
                    <div className="text-[10px] text-slate-500">Above editorial footer</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={adsFooter}
                    onChange={(e) => setAdsFooter(e.target.checked)}
                    className="w-4 h-4 text-[#0b2545] rounded"
                  />
                </label>
              </div>
            </div>

            {/* 4. Social Media Channels */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200 flex items-center">
                <Share2 className="w-4 h-4 mr-1.5 text-[#0b2545]" />
                Official Social Media Channels
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    X (Twitter) Profile URL
                  </label>
                  <input
                    type="url"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Telegram News Channel
                  </label>
                  <input
                    type="url"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    WhatsApp News Channel
                  </label>
                  <input
                    type="url"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                  />
                </div>
              </div>
            </div>

            {/* 5. Administrator Credentials & Security */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200 flex items-center">
                <Shield className="w-4 h-4 mr-1.5 text-blue-600" />
                Administrator Profile & Password
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Editor Display Name
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value="admin@nrknews24.com"
                    className="w-full p-2 border border-slate-200 bg-slate-50 rounded text-xs text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Change Password (Leave blank to keep current password)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="password"
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0b2545]"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-2.5 bg-[#0b2545] hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {saving ? 'Saving Changes...' : 'Save All Settings'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
