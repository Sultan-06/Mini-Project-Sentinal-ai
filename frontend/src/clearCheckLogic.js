export const MESSAGE_EXAMPLES = {
  otp: "URGENT: Your bank account will be blocked in 2 hours because your KYC is expired. Click http://bank-kyc-update-now.xyz immediately and share your OTP to keep your account active.",
  prize: "Congratulations! Your mobile number won Rs. 5,00,000 in our Lucky Draw! To claim your prize today, send a small processing fee of Rs. 999 via UPI before midnight.",
  delivery: "Hi! Your package from BlueDart (#BD847291) is out for delivery today between 2:00 PM and 5:00 PM. No payment is required at the door.",
};

export const LINK_EXAMPLES = {
  bank: "http://secure-hdfc-bank-verify.xyz/login?confirm=account",
  short: "https://bit.ly/claim-reward-gift-now",
  wiki: "https://en.wikipedia.org/wiki/Internet_safety",
};

export function buildMessageHeuristicResult(text) {
  const lower = text.toLowerCase();
  const rules = [
    ["urgent", "It tries to rush you with urgent wording so you don't stop to think.", 22],
    ["immediately", "It pressures you to act right away, a very common scam tactic.", 18],
    ["blocked", "It threatens that your account will be blocked or closed.", 24],
    ["suspended", "It threatens that your account has been suspended.", 24],
    ["kyc", "It asks you to update KYC through a text message, which real banks don't do via random links.", 22],
    ["otp", "It asks for an OTP or secret code — real companies never ask you to share these.", 30],
    ["pin", "It mentions sharing a PIN or password.", 26],
    ["password", "It asks for your password or login information.", 26],
    ["congratulations", "It claims you've unexpectedly won something out of the blue.", 18],
    ["lucky draw", "Unexpected lottery or lucky draw winnings are almost always fake.", 28],
    ["won", "It promises surprise prize money or rewards.", 16],
    ["processing fee", "It asks you to pay a fee upfront to receive money or a prize.", 30],
    ["registration fee", "Asking for an upfront fee is a classic warning sign of a scam.", 28],
    ["upi", "It asks you to send a payment directly via UPI to an unverified person.", 18],
    ["http://", "It includes an older, unencrypted web link that looks unsafe.", 22],
    ["click", "It pushes you to click an unfamiliar link.", 12],
    ["midnight", "It sets an artificial deadline to make you feel pressured.", 14],
  ];

  let score = 0;
  const matchedPhrases = [];
  const reasons = [];
  rules.forEach(([phrase, reason, weight]) => {
    if (lower.includes(phrase)) {
      score += weight;
      matchedPhrases.push(phrase);
      if (!reasons.includes(reason)) reasons.push(reason);
    }
  });

  let status = "safe";
  let title = "Looks Safe";
  let subtitle = "We didn't spot any common scam tricks or pushy language in this message.";
  let confidence = 93;
  let advice = "This message reads like a normal update. Even so, never share secret codes or bank details if someone unexpectedly asks later.";

  if (score >= 52) {
    status = "danger";
    title = "Likely a Scam";
    subtitle = "This message shows several strong warning signs commonly used by scammers.";
    confidence = Math.min(98, Math.round(80 + score * 0.16));
    advice = "Don't reply, don't tap any links, and never share any codes or money. If you're worried about your account, call the official number on the back of your card.";
  } else if (score >= 22) {
    status = "caution";
    title = "Be Careful";
    subtitle = "A few phrases here look slightly unusual and worth double-checking before you act.";
    confidence = Math.min(86, Math.round(68 + score * 0.35));
    advice = "Pause before replying or clicking anything. If this claims to be from someone you know or a company you use, contact them directly through their official app or number.";
  } else {
    reasons.push(
      "The tone is calm and doesn't pressure you to act urgently.",
      "It doesn't ask you to share secret codes, passwords, or unexpected payments.",
    );
  }

  return { type: "message", status, title, subtitle, confidence, originalText: text, matchedPhrases, reasons: reasons.slice(0, 3), advice };
}

export function buildLinkHeuristicResult(rawUrl) {
  let cleaned = rawUrl.trim();
  if (!/^https?:\/\//i.test(cleaned)) cleaned = "http://" + cleaned;

  let parsed;
  try {
    parsed = new URL(cleaned);
  } catch {
    throw new Error("That doesn't look like a complete website link. Try pasting the full address.");
  }

  const host = parsed.hostname.toLowerCase();
  const isHttps = parsed.protocol === "https:";
  const parts = host.split(".");
  const tld = parts.length > 1 ? "." + parts[parts.length - 1] : "";
  const shorteners = ["bit.ly", "tinyurl.com", "t.co", "rb.gy", "is.gd", "ow.ly", "cutt.ly"];
  const riskyTlds = [".xyz", ".top", ".tk", ".ml", ".click", ".gq", ".cf", ".work"];
  const trustedDomains = ["wikipedia.org", "google.com", "apple.com", "microsoft.com", "amazon.com", "github.com", "gov.in"];
  const isShortener = shorteners.some((domain) => host === domain || host.endsWith("." + domain));
  const hasRiskyTld = riskyTlds.includes(tld);
  const isTrusted = trustedDomains.some((domain) => host === domain || host.endsWith("." + domain));
  const looksLikeSpoof = !isTrusted && /(bank|hdfc|sbi|icici|paypal|paypa1|arnazon|amazon|google|g00gle|apple|verify|secure-login|update-account)/i.test(host);

  let risk = 0;
  const reasons = [];
  if (!isHttps) {
    risk += 30;
    reasons.push("This website does not use a secure padlock connection (HTTPS), so anything you type isn't protected.");
  }
  if (looksLikeSpoof) {
    risk += 38;
    reasons.push("The web address tries to imitate a well-known bank or trusted service, even though it isn't their real website.");
  }
  if (hasRiskyTld) {
    risk += 26;
    reasons.push(`The ending "${tld}" is very commonly used by temporary fake websites.`);
  }
  if (isShortener) {
    risk += 38;
    reasons.push("This is a shortened link, which hides the real website address until after you click it.");
  }

  let status = "safe";
  let title = "Looks Safe";
  let subtitle = "This link points to a recognizable, securely encrypted website.";
  let confidence = 94;
  let advice = "This website looks trustworthy. Still, always double-check the address bar before entering any passwords or card numbers.";
  if (risk >= 60) {
    status = "danger";
    title = "Likely a Scam Link";
    subtitle = "This link has strong signs of a fake website trying to steal logins or personal details.";
    confidence = Math.min(97, Math.round(78 + risk * 0.2));
    advice = "Do not open this link or sign in on it. Instead, type the company's real website into your browser yourself or use their official app.";
  } else if (risk >= 30) {
    status = "caution";
    title = "Be Careful";
    subtitle = "We can't fully confirm where this link leads or who runs it.";
    confidence = 82;
    advice = "Only tap this link if you personally know and trust the sender. Never type passwords or bank details after opening a shortened or unfamiliar link.";
  } else {
    reasons.push(
      "It uses a standard secure connection (HTTPS) to keep your browsing private.",
      "The web address matches a clean, genuine domain without lookalike tricks.",
    );
  }

  return {
    type: "link", status, title, subtitle, confidence, originalUrl: rawUrl.trim(), realDomain: host,
    checks: [
      { label: "Website Security", status: isHttps ? "safe" : "danger", text: isHttps ? "Uses a secure encrypted connection (HTTPS)" : "Not encrypted — missing secure padlock" },
      { label: "Domain Trust", status: hasRiskyTld ? "danger" : isShortener ? "caution" : "safe", text: hasRiskyTld ? `Uses a high-risk website ending (${tld})` : isShortener ? "Hides the final destination behind a shortener" : "Clean, standard website address" },
      { label: "Lookalike Check", status: looksLikeSpoof ? "danger" : "safe", text: looksLikeSpoof ? "Looks like it is impersonating a known brand" : "No brand impersonation spotted" },
    ],
    reasons: reasons.slice(0, 3),
    advice,
  };
}

export function generateSamplePhotoCanvas(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 440;
  const ctx = canvas.getContext("2d");
  if (type === "real") {
    const sky = ctx.createLinearGradient(0, 0, 0, 275);
    sky.addColorStop(0, "#7FB3D5");
    sky.addColorStop(0.55, "#D4E6F1");
    sky.addColorStop(1, "#FDEBD0");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 275);
    const sun = ctx.createRadialGradient(470, 125, 10, 470, 125, 95);
    sun.addColorStop(0, "rgba(255,251,235,.95)");
    sun.addColorStop(1, "rgba(254,240,138,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(375, 30, 190, 190);
    ctx.fillStyle = "#85929E";
    ctx.beginPath();
    ctx.moveTo(0,275); ctx.lineTo(130,170); ctx.lineTo(265,235); ctx.lineTo(410,145); ctx.lineTo(560,225); ctx.lineTo(640,190); ctx.lineTo(640,275); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#52796F";
    ctx.beginPath();
    ctx.moveTo(0,310); ctx.quadraticCurveTo(180,215,360,290); ctx.quadraticCurveTo(510,250,640,285); ctx.lineTo(640,340); ctx.lineTo(0,340); ctx.closePath(); ctx.fill();
    const lake = ctx.createLinearGradient(0,310,0,440);
    lake.addColorStop(0,"#A9CCE3"); lake.addColorStop(1,"#5D6D7E");
    ctx.fillStyle = lake; ctx.fillRect(0,310,640,130);
    ctx.fillStyle = "rgba(31,41,55,.03)";
    for (let i=0;i<450;i++) ctx.fillRect((i*73)%640,(i*131)%440,2,2);
  } else {
    const bg = ctx.createLinearGradient(0,0,640,440);
    bg.addColorStop(0,"#E0E7FF"); bg.addColorStop(.5,"#FCE7F3"); bg.addColorStop(1,"#DBEAFE");
    ctx.fillStyle = bg; ctx.fillRect(0,0,640,440);
    ctx.fillStyle = "#6366F1";
    ctx.beginPath(); ctx.ellipse(320,405,130,95,0,Math.PI,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#F5CBA7"; ctx.fillRect(295,260,50,55);
    ctx.beginPath(); ctx.ellipse(320,195,68,82,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth=4;
    ctx.beginPath(); ctx.arc(320,195,108,0,Math.PI*2); ctx.stroke();
  }
  ctx.save();
  const label = type === "ai" ? "AI Portrait Sample" : "Natural Photo Sample";
  ctx.font = "600 14px Inter, sans-serif";
  const width = ctx.measureText(label).width + 28;
  ctx.fillStyle = type === "ai" ? "#FEF2F2" : "#ECFDF5";
  ctx.beginPath(); ctx.roundRect(18,18,width,34,10); ctx.fill();
  ctx.fillStyle = type === "ai" ? "#DC2626" : "#059669";
  ctx.fillText(label,32,40); ctx.restore();
  return canvas.toDataURL("image/png");
}

export function buildPhotoResult(selectedPhoto) {
  const name = (selectedPhoto.fileName || "").toLowerCase();
  let isAi = selectedPhoto.sampleType === "ai";
  let isUncertain = selectedPhoto.sampleType === null && /(edit|filter|whatsapp|screenshot|render)/.test(name);
  if (selectedPhoto.sampleType === null && /(ai|midjourney|dalle|stable|fake|generated|synth|deepfake)/.test(name)) isAi = true;
  if (isAi) {
    return {
      type:"photo", status:"danger", title:"Likely AI-Generated", subtitle:"This photo shows smooth patterns and lighting clues often left behind by AI image tools.", confidence:92,
      imageUrl:selectedPhoto.dataUrl, fileName:selectedPhoto.fileName,
      pills:[{label:"Natural Lighting & Skin",state:"danger",note:"Unusually smooth glow"},{label:"Fine Detail Consistency",state:"caution",note:"Soft blended edges"},{label:"Digital Editing Clues",state:"danger",note:"AI creation patterns found"}],
      reasons:["The lighting and surface smoothness look overly polished compared to a regular camera photo.","Fine background details show subtle patterns commonly created by AI generators.","Normal camera details that usually come with real photos appear to be missing."],
      advice:"Treat this image with caution and avoid sharing it as real news or proof. If someone sent it to verify their identity, ask for a live video call instead.",
    };
  }
  if (isUncertain) {
    return {
      type:"photo", status:"caution", title:"Be Careful — Possibly Edited", subtitle:"We couldn't confirm if this photo is completely untouched. It may be heavily filtered or re-saved.", confidence:76,
      imageUrl:selectedPhoto.dataUrl, fileName:selectedPhoto.fileName,
      pills:[{label:"Natural Lighting & Skin",state:"safe",note:"Looks mostly natural"},{label:"Fine Detail Consistency",state:"caution",note:"Slightly compressed"},{label:"Digital Editing Clues",state:"caution",note:"Re-saved or filtered"}],
      reasons:["Messaging apps and photo filters often remove original camera details when saving.","Some areas look slightly smoothed, which can happen from either phone beauty filters or editing."],
      advice:"Ask where the photo originally came from before trusting it for anything important, especially if it involves money or breaking news.",
    };
  }
  return {
    type:"photo", status:"safe", title:"Looks Safe & Real", subtitle:"This photo looks consistent with a genuine picture taken by a real camera.", confidence:91,
    imageUrl:selectedPhoto.dataUrl, fileName:selectedPhoto.fileName,
    pills:[{label:"Natural Lighting & Skin",state:"safe",note:"Consistent shadows & light"},{label:"Fine Detail Consistency",state:"safe",note:"Natural camera texture"},{label:"Digital Editing Clues",state:"safe",note:"No AI patterns spotted"}],
    reasons:["The light, shadows, and natural texture match what real camera lenses capture.","We didn't find the telltale repeating patterns or artificial smoothing made by AI generators."],
    advice:"This photo appears authentic. As a good habit, still check the context of where a photo was posted before sharing it widely.",
  };
}
