import mailer from "./mailer.js";

async function otpMail({ to, otpCode, userName }) {
  try {
    await mailer.sendMail({
      from: "GoviSala App <govisala.app@gmail.com>",
      to: to,
      subject: "Your OTP for GoviSala Login",
      text: `Your OTP for GoviSala App is ${otpCode}`,
      html: `
      <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>GoviSala OTP</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
    />
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");
    </style>
  </head>
  <body
    style="
      margin: 0;
      font-family: 'Poppins', sans-serif;
      background: #fcffe0;
      font-size: 14px;
    "
  >
    <div
      style="
        max-width: 680px;
        margin: 0 auto;
        padding: 45px 30px 60px;
        background-repeat: no-repeat;
        background-size: 800px 452px;
        background-position: top center;
        font-size: 14px;
        color: #434343;
      "
    >
      <header>
        <table style="width: 100%">
          <tbody>
            <tr style="height: 0">
              <td>
                <h1 style="color: #354040">GoviSala</h1>
              </td>
              <td style="text-align: right">
                <span style="font-size: 16px; line-height: 30px; color: #354040"
                  >${new Date().toString().split(" GMT")[0]}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </header>

      <main>
        <div
          style="
            margin: 0;
            margin-top: 70px;
            padding: 92px 30px 115px;
            background: #c0d85f;
            border-radius: 30px;
            text-align: center;
          "
        >
          <div style="width: 100%; max-width: 489px; margin: 0 auto">
            <h1
              style="
                margin: 0;
                font-size: 24px;
                font-weight: 500;
                color: #1f1f1f;
              "
            >
              Your OTP for GoviSala Login
            </h1>
            <p
              style="
                margin: 0;
                margin-top: 17px;
                font-size: 16px;
                font-weight: 500;
              "
            >
              Hey ${userName},
            </p>
            <p
              style="
                margin: 0;
                margin-top: 17px;
                font-weight: 500;
                letter-spacing: 0.56px;
              "
            >
              Thank you for choosing GoviSala. Use the following OTP to complete
              the procedure to change your email address. OTP is valid for
              <span style="font-weight: 600; color: #1f1f1f">5 minutes</span>.
              Do not share this code with others.
            </p>
            <p
              style="
                margin: 0;
                margin-top: 60px;
                font-size: 40px;
                font-weight: 600;
                letter-spacing: 25px;
                color: #4e7456;
              "
            >
              ${otpCode}
            </p>
          </div>
        </div>

        <p
          style="
            max-width: 400px;
            margin: 0 auto;
            margin-top: 90px;
            text-align: center;
            font-weight: 500;
            color: #8c8c8c;
          "
        >
          Need help? Ask at
          <a
            href="mailto:govisala.app@gmail.com"
            style="color: #4e7456; text-decoration: none"
            >govisala.app@gmail.com</a
          >
          or visit our
          <a
            href=""
            target="_blank"
            style="color: #4e7456; text-decoration: none"
            >Help Center</a
          >
        </p>
      </main>

      <footer
        style="
          width: 100%;
          max-width: 490px;
          margin: 20px auto 0;
          text-align: center;
          border-top: 1px solid #e6ebf1;
        "
      >
        <p
          style="
            margin: 0;
            margin-top: 40px;
            font-size: 16px;
            font-weight: 600;
            color: #434343;
          "
        >
          Project by Team GoviSala
        </p>
        <p style="margin: 0; margin-top: 8px; color: #434343">
          Department of Computer Science, University of Ruhuna
        </p>
        <p style="margin: 0; margin-top: 16px; color: #434343">
          Copyright © 2025. All rights reserved.
        </p>
      </footer>
    </div>
  </body>
</html>

      `,
      //       html: `
      //       <!DOCTYPE html>
      // <html lang="en">
      //   <head>
      //     <meta charset="UTF-8" />
      //     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      //     <meta http-equiv="X-UA-Compatible" content="ie=edge" />
      //     <title>GoviSala OTP</title>
      //     <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap">

      //   </head>
      //   <body
      //     style="
      //       margin: 0;
      //       font-family: 'Poppins', sans-serif;
      //       background: #FCFFE0;
      //       font-size: 14px;
      //     "
      //   >
      //     <div
      //       style="
      //         max-width: 680px;
      //         margin: 0 auto;
      //         padding: 45px 30px 60px;
      //         background-repeat: no-repeat;
      //         background-size: 800px 452px;
      //         background-position: top center;
      //         font-size: 14px;
      //         color: #434343;
      //       "
      //     >
      //       <header>
      //         <table style="width: 100%;">
      //           <tbody>
      //             <tr style="height: 0;">
      //               <td>
      //                 <h1>GoviSala</h1>
      //               </td>
      //               <td style="text-align: right;">
      //                 <span
      //                   style="font-size: 16px; line-height: 30px; color: #75A47F;"
      //                   >${new Date().toString()}</span
      //                 >
      //               </td>
      //             </tr>
      //           </tbody>
      //         </table>
      //       </header>

      //       <main>
      //         <div
      //           style="
      //             margin: 0;
      //             margin-top: 70px;
      //             padding: 92px 30px 115px;
      //             background: #ffffff;
      //             border-radius: 30px;
      //             text-align: center;
      //           "
      //         >
      //           <div style="width: 100%; max-width: 489px; margin: 0 auto;">
      //             <h1
      //               style="
      //                 margin: 0;
      //                 font-size: 24px;
      //                 font-weight: 500;
      //                 color: #1f1f1f;
      //               "
      //             >
      //               Your OTP for GoviSala Login
      //             </h1>
      //             <p
      //               style="
      //                 margin: 0;
      //                 margin-top: 17px;
      //                 font-size: 16px;
      //                 font-weight: 500;
      //               "
      //             >
      //               Hey ${userName},
      //             </p>
      //             <p
      //               style="
      //                 margin: 0;
      //                 margin-top: 17px;
      //                 font-weight: 500;
      //                 letter-spacing: 0.56px;
      //               "
      //             >
      //               Thank you for choosing GoviSala. Use the following OTP
      //               to complete the procedure to change your email address. OTP is
      //               valid for
      //               <span style="font-weight: 600; color: #1f1f1f;">5 minutes</span>.
      //               Do not share this code with others.
      //             </p>
      //             <p
      //               style="
      //                 margin: 0;
      //                 margin-top: 60px;
      //                 font-size: 40px;
      //                 font-weight: 600;
      //                 letter-spacing: 25px;
      //                 color: #4E7456;
      //               "
      //             >
      //               ${otpCode}
      //             </p>
      //           </div>
      //         </div>

      //         <p
      //           style="
      //             max-width: 400px;
      //             margin: 0 auto;
      //             margin-top: 90px;
      //             text-align: center;
      //             font-weight: 500;
      //             color: #8c8c8c;
      //           "
      //         >
      //           Need help? Ask at
      //           <a
      //             href="mailto:govisala.app@gmail.com"
      //             style="color: #499fb6; text-decoration: none;"
      //             >govisala.app@gmail.com</a
      //           >
      //           or visit our
      //           <a
      //             href=""
      //             target="_blank"
      //             style="color: #499fb6; text-decoration: none;"
      //             >Help Center</a
      //           >
      //         </p>
      //       </main>

      //       <footer
      //         style="
      //           width: 100%;
      //           max-width: 490px;
      //           margin: 20px auto 0;
      //           text-align: center;
      //           border-top: 1px solid #e6ebf1;
      //         "
      //       >
      //         <p
      //           style="
      //             margin: 0;
      //             margin-top: 40px;
      //             font-size: 16px;
      //             font-weight: 600;
      //             color: #434343;
      //           "
      //         >
      //           Govisala
      //         </p>
      //         <p style="margin: 0; margin-top: 8px; color: #434343;">
      //           Department of Computer Science, University of Ruhuna
      //         </p>
      //         <div style="margin: 0; margin-top: 16px;">
      //           <a href="" target="_blank" style="display: inline-block;">
      //             <img
      //               width="36px"
      //               alt="Facebook"
      //               src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661502815169_682499/email-template-icon-facebook"
      //             />
      //           </a>
      //           <a
      //             href=""
      //             target="_blank"
      //             style="display: inline-block; margin-left: 8px;"
      //           >
      //             <img
      //               width="36px"
      //               alt="Instagram"
      //               src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661504218208_684135/email-template-icon-instagram"
      //           /></a>
      //           <a
      //             href=""
      //             target="_blank"
      //             style="display: inline-block; margin-left: 8px;"
      //           >
      //             <img
      //               width="36px"
      //               alt="Twitter"
      //               src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503043040_372004/email-template-icon-twitter"
      //             />
      //           </a>
      //           <a
      //             href=""
      //             target="_blank"
      //             style="display: inline-block; margin-left: 8px;"
      //           >
      //             <img
      //               width="36px"
      //               alt="Youtube"
      //               src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503195931_210869/email-template-icon-youtube"
      //           /></a>
      //         </div>
      //         <p style="margin: 0; margin-top: 16px; color: #434343;">
      //           Copyright © 2025 Company. All rights reserved.
      //         </p>
      //       </footer>
      //     </div>
      //   </body>
      // </html>

      //       `,
    });
  } catch (error) {
    console.error(error);
  }
}

export default otpMail;
