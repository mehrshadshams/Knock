## ADDED Requirements

### Requirement: Quality tier definitions
The system SHALL define exactly three video quality tiers — High, Medium, Low — with the following encoding caps applied via `RTCRtpSender.setParameters()`:

| Tier   | maxBitrate (bps) | maxFramerate | scaleResolutionDownBy |
|--------|------------------|--------------|-----------------------|
| High   | 1_500_000        | 30           | 1                     |
| Medium | 600_000          | 24           | 1.5                   |
| Low    | 200_000          | 15           | 3                     |

#### Scenario: Tier applied to outgoing video sender
- **WHEN** a tier is selected (automatically or manually)
- **THEN** the system SHALL update `encodings[0].maxBitrate`, `encodings[0].maxFramerate`, and `encodings[0].scaleResolutionDownBy` on the video `RTCRtpSender` to the values defined for that tier and call `setParameters()`

#### Scenario: 240p floor
- **WHEN** the Low tier is in effect on a 720p source
- **THEN** the resulting outgoing video SHALL be approximately 240p (i.e., `scaleResolutionDownBy` of 3 against a 720p source) and capped at 200 kbps and 15 fps

### Requirement: Request 720p source resolution
The system SHALL request the local camera with an ideal resolution of 1280×720 so that downscale ratios produce predictable target resolutions.

#### Scenario: getUserMedia constraints
- **WHEN** the client calls `getUserMedia` for the call
- **THEN** the video constraints SHALL include `width: { ideal: 1280 }` and `height: { ideal: 720 }`

### Requirement: Automatic quality adaptation
The system SHALL monitor connection statistics during a call and automatically adjust the active tier when in Auto mode.

#### Scenario: Polling interval
- **WHEN** a call is active and the quality selector is set to Auto
- **THEN** the system SHALL poll `RTCPeerConnection.getStats()` every 3 seconds

#### Scenario: Classification thresholds
- **WHEN** stats are sampled
- **THEN** the system SHALL classify the connection as:
  - **Good** if RTT < 200 ms AND loss rate < 2% AND (available outgoing bitrate >= 800 kbps OR unknown)
  - **Fair** if RTT < 400 ms AND loss rate < 7% AND (available outgoing bitrate >= 300 kbps OR unknown)
  - **Poor** otherwise
- and SHALL map Good → High, Fair → Medium, Poor → Low

#### Scenario: Immediate downgrade
- **WHEN** the classifier yields a tier lower than the current tier
- **THEN** the system SHALL apply the lower tier on the next sample without delay

#### Scenario: Hysteresis on upgrade
- **WHEN** the classifier yields a tier higher than the current tier
- **THEN** the system SHALL apply the higher tier only after the higher classification has been observed in two consecutive samples

### Requirement: Manual quality override
The system SHALL provide a quality selector with options Auto, High, Medium, Low.

#### Scenario: Manual selection suspends auto-adapt
- **WHEN** the user selects High, Medium, or Low
- **THEN** the system SHALL apply the chosen tier immediately and SHALL stop adjusting the tier automatically until the user selects Auto again

#### Scenario: Returning to Auto resumes adaptation
- **WHEN** the user selects Auto after a manual override
- **THEN** the system SHALL resume the polling loop and reclassify the connection on the next sample

#### Scenario: Default selection
- **WHEN** a call starts
- **THEN** the quality selector SHALL default to Auto

### Requirement: Connection quality indicator
The system SHALL display a connection-quality indicator in the call UI reflecting the most recent classification.

#### Scenario: Indicator updates on each sample
- **WHEN** a stats sample is classified
- **THEN** the indicator SHALL update to show one of "Good", "Fair", or "Poor" with a corresponding visual style (e.g., green / amber / red)

#### Scenario: Indicator tooltip exposes raw metrics
- **WHEN** the user hovers or focuses the indicator
- **THEN** a tooltip SHALL display the most recent RTT, packet-loss percentage, and available outgoing bitrate (or "unknown" for any unavailable metric)

#### Scenario: Indicator visible during manual override
- **WHEN** the quality selector is set to a manual tier
- **THEN** the indicator SHALL still update on each poll so the user can see measured connection quality independently of the active tier

### Requirement: Resilience to missing stats fields
The system SHALL tolerate browsers that do not expose every `getStats()` field used by the classifier.

#### Scenario: Missing availableOutgoingBitrate
- **WHEN** `availableOutgoingBitrate` is not present in any candidate-pair report
- **THEN** the classifier SHALL ignore that metric and base classification on RTT and loss only

#### Scenario: setParameters not supported
- **WHEN** `RTCRtpSender.setParameters()` throws or is not implemented
- **THEN** the system SHALL log a warning and continue without crashing the call; the UI SHALL still reflect the requested tier
