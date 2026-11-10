/* Toolbench site config. Fill these in when the accounts exist.
   Empty values mean the matching slots render nothing at all. */
window.SITE_CONFIG = {
  // AdSense publisher id, like 'ca-pub-1234567890123456'
  ADSENSE_CLIENT: '',
  // AdSense ad unit ids (data-ad-slot) per position. Leave '' to keep a position off.
  AD_SLOTS: {
    after_intro: '',
    mid_content: '',
    end_content: '',
    sidebar: ''
  },
  // Not used on this site yet (AdSense only), kept for network consistency.
  AMAZON_TAG: '',
  // HubSpot contact form (portal 20693956). Add the form GUID to show the form on /contact/.
  HUBSPOT_PORTAL: '20693956',
  HUBSPOT_REGION: 'na1',
  HUBSPOT_CONTACT_FORM: '',
  MEETINGS_URL: 'https://meetings.hubspot.com/sam-barth/meeting-with-sam'
};
