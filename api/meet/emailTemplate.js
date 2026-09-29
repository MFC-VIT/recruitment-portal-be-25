// HTML body for the interview confirmation mail (images are inline CID attachments).
function emailTemplate({ candidateName, date, start, end, meetLink }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">

<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #000000 !important;
    font-family: Arial, sans-serif;
  }

  table {
    border-collapse: collapse;
  }

  .outer {
    width: 100%;
    max-width: 600px;
  }

  /* MOBILE FIRST */
  .two-col {
    width: 320px;
  }

  .text {
    color: #ffffff !important;
    font-size: 11.5px;
    line-height: 1.4;
  }

  .muted {
    color: #d8d8d8 !important;
  }

  .link {
    color: #ff7824 !important;
    text-decoration: none;
    word-break: break-word;
  }

  /* DESKTOP ONLY */
  @media only screen and (min-width: 601px) {
    .two-col {
      width: 560px !important;
    }

    .left-img {
      width: 280px !important;
    }

    .left-img img {
      width: 280px !important;
      height: auto !important;
    }

    .right-text {
      width: 280px !important;
      font-size: 13.5px !important;
      line-height: 1.55 !important;
    }
  }
</style>
</head>

<body>

<!-- WRAPPER 1 -->
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000">
<tr>
<td align="center" bgcolor="#000000">

<!-- WRAPPER 2 -->
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000">
<tr>
<td align="center" bgcolor="#000000">

<!-- WRAPPER 3 / OUTER -->
<table class="outer" width="100%" cellpadding="0" cellspacing="0" align="center"
       bgcolor="#000000" style="background-color:#000000;">

<!-- HEADER IMAGE -->
<tr>
<td align="center" bgcolor="#000000" style="background-color:#000000;">
  <img
    src="cid:header_img"
    width="600"
    style="width:100%; max-width:600px; display:block;"
    alt="MFC Interview Confirmation"
  />
</td>
</tr>

<!-- CONTENT -->
<tr>
<td align="center" bgcolor="#000000" style="background-color:#000000;">

<table class="two-col" width="320" cellpadding="0" cellspacing="0" align="center"
       bgcolor="#000000" style="background-color:#000000;">
<tr>

<!-- LEFT IMAGE -->
<td width="150" valign="bottom" class="left-img"
    bgcolor="#000000" style="background-color:#000000;">
  <img
    src="cid:building_img"
    width="150"
    style="display:block;"
    alt="MFC Building"
  />
</td>

<!-- RIGHT TEXT -->
<td
  width="170"
  valign="top"
  class="text right-text"
  bgcolor="#000000"
  style="padding-left:14px; background-color:#000000;"
>

  <b>Dear candidate,</b><br><br>

  <span class="muted">
    Please find the details for your scheduled meeting below:
  </span><br><br>

  <b>Candidate:</b> ${candidateName}<br>
  <b>Date:</b> ${date}<br>
  <b>Time:</b> ${start} – ${end}<br><br>

  <b>Google Meet:</b><br>
  <a class="link" href="${meetLink}">
    ${meetLink}
  </a>

</td>
</tr>
</table>

</td>
</tr>

<!-- FOOTER (FORCED ORANGE, CLICKABLE, GMAIL-iOS SAFE) -->
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0"
       bgcolor="#FF8C42" style="background-color:#FF8C42;">
<tr>
<td align="center"
    bgcolor="#FF8C42"
    style="padding:14px; background-color:#FF8C42;">

  <a href="https://www.instagram.com/mfc_vit" style="display:inline-block;">
    <img src="cid:insta_icon" width="22"
         style="display:block; margin:0 12px;" />
  </a>

  <a href="https://www.linkedin.com/company/mfcvit" style="display:inline-block;">
    <img src="cid:linkedin_icon" width="22"
         style="display:block; margin:0 12px;" />
  </a>

  <a href="mailto:mozillafirefox@vit.ac.in" style="display:inline-block;">
    <img src="cid:mail_icon" width="22"
         style="display:block; margin:0 12px;" />
  </a>

</td>
</tr>
</table>

</td>
</tr>

</table>
</td>
</tr>
</table>
</td>
</tr>
</table>

</body>
</html>`;
}

const ATTACHMENTS = [
  ["header.webp", "header_img"],
  ["building.webp", "building_img"],
  ["instagram.png", "insta_icon"],
  ["linkedin.png", "linkedin_icon"],
  ["email.png", "mail_icon"],
].map(([filename, cid]) => ({
  filename,
  path: require("path").join(__dirname, filename),
  cid,
}));

module.exports = { emailTemplate, ATTACHMENTS };
