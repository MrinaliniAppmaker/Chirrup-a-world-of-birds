# Private content-report review

Reports are private database records, not public comments or emails. Guests can
submit them; no reporter account, email address or device identifier is stored.
The report contains selected content, a reason, optional details and, if chosen,
a bounded image snapshot in private App Storage. Report data may itself contain
sensitive or offensive material.

## Operator workflow

These commands run locally with the server environment already configured.
Access requires access to this project and its backend environment. There is no
public report-list or evidence-download endpoint.

```sh
pnpm --filter @workspace/api-server run reports:review --list
pnpm --filter @workspace/api-server run reports:review --show REPORT_UUID
pnpm --filter @workspace/api-server run reports:review --export REPORT_UUID
pnpm --filter @workspace/api-server run reports:review --resolve REPORT_UUID --note "Review outcome and safety action taken"
```

- Check pending reports regularly. Review the attached output, not just its title.
- Export produces a self-contained private HTML file under `generated-artifacts`.
  It is excluded from Git and deployment. Do not publish it or register it as a
  shareable asset. Delete the local export when review is finished.
- Confirm whether the issue is harmful content, a privacy concern, or an anatomy
  mismatch. Record the outcome and any required filtering/prompt change.
- `--resolve` records a human review only. It does not claim that a model was
  retrained, automatically change prompts or delete birds/accounts.
- Do not put passwords, one-time codes, signed storage links or personal details
  in review notes. Process privacy/deletion requests through the verified support
  process; never treat an anonymous report as proof of account ownership.
- The command uses its current server database environment; it does not discover,
  copy or migrate a production database. Production review access must be
  established by the operator before release.

Report POSTs are rate limited and use random submission IDs for safe retries.
The same ID with changed content is rejected. Success is only shown after the
backend returns a stored receipt. If saving fails, the form retains its text.

These controls do not establish child consent or AI-provider eligibility. Those
remain separate production-release requirements.
