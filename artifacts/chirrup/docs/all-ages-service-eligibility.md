# All-ages service eligibility

Reviewed: 26 November 2026.

CHIRRUP is **for all ages**. This includes children under 13 and does not remove
age-specific privacy, consent, authentication or AI-service requirements.
This is an engineering qualification record, not legal advice or a declaration
that the app is compliant.

## Findings from official sources

| Service | Verified requirement | CHIRRUP status |
| --- | --- | --- |
| Gemini Developer API | Google's published direct API terms exclude API clients directed toward or likely to be accessed by under-18s. Parent approval does not override that exclusion. | Current pictures use Gemini through Replit. No applicable managed-service agreement or written exception permitting CHIRRUP's audience has been established. Do not claim that the broker either waives or necessarily inherits the direct restriction without checking the governing agreement. |
| OpenAI API | The under-18 guidance requires additional safety measures. Personal data of under-13s, or those below the applicable age of digital consent, must not be processed without first implementing Zero Data Retention. | Current text/trait services use managed OpenAI. No evidence of the required retention configuration for this app has been obtained. `store: false` alone is not proof of Zero Data Retention. |
| OpenAI retention controls | Zero Data Retention requires prior approval and account/project configuration. Image generation has model-specific eligibility and exceptions, including CSAM handling. | A direct, appropriately approved OpenAI project is a candidate, not a verified replacement. The current proxy's documented image model and a different directly available image model are not interchangeable assumptions. No model, account or billing changes have been made. |
| Clerk | Standard terms prohibit sending/storing personal information of end users under 16 without providing Clerk evidence of verifiable parental consent. The privacy policy also says services are not intended for under-16s. | Authentication is Replit-managed. Establish the applicable managed agreement and the accepted process for consent evidence before enabling child accounts. An app-side checkbox or database row alone does not establish provider acceptance. |
| Epic Kids Web Services | Its official FAQ describes parent verification and consent-management services as free for developers. Parent Verification alone verifies adult status; the technical documentation explicitly says it does not obtain consent or satisfy direct-notice requirements. | Candidate for adult verification combined with a properly designed notice/consent flow or its consent-management product. No KWS account, credentials, integration or parent-data transfer has been set up. Country-specific verification methods and product access still need qualification. |

## Required implementation boundary

- Ask a neutral, age-appropriate eligibility question without steering users
  toward an adult answer. Collect no more age/location information than needed.
- Do not initialize third-party authentication or accept child personal data
  before the applicable permissions and verified consent are established.
- Keep adult verification distinct from the guardian's authority and their
  informed consent to specific data uses. Do not ask users to send passwords,
  OTPs, identity documents or payment details to CHIRRUP support or this chat.
- Validate provider callbacks on the server, bind them to the correct pending
  request, and reject forgery, replay and expired/refused/revoked permissions.
- Enforce access on every relevant server route, including guest generation,
  AI trait checking and interactions. A browser-only age gate is not enforcement.
- Support notice versions, scoped permissions, withdrawal and data deletion with
  minimal records. Define applicable country/age rules from qualified review;
  do not assume one universal under-13 threshold covers an Indian/global app.
- Preserve existing adult sessions, account isolation, all-ages intent, artwork,
  input behavior and the generated guest bird's sign-in handoff.

## What has not been completed

No age gate, consent flow, child-authorized AI connection or child-account
permission has been implemented or verified in this qualification step. No
provider was switched, account created, paid generation requested, or deployment
published. Those facts must not be described as completed release fixes.

An owner-approved service route and the relevant account/provider approvals are
needed before implementing a consent interface that purports to enable access.
While those approvals are pending, do not publicly launch CHIRRUP for all ages.

## Official sources

- Gemini API additional terms: https://ai.google.dev/gemini-api/terms
- OpenAI under-18 guidance: https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
- OpenAI data controls and image-model limitations: https://developers.openai.com/api/docs/guides/your-data
- Clerk terms: https://clerk.com/legal/terms
- Clerk privacy policy: https://clerk.com/legal/privacy
- KWS FAQ: https://www.kidswebservices.com/faq
- KWS parent-verification flow and consent limitation: https://dev.epicgames.com/docs/kids-web-services/parent-verification-service/pv-service-flow
- Replit AI integrations: https://docs.replit.com/features/integrations/replit-ai-integrations
