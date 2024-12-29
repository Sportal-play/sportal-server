- TODO let opponent send `finish-req` to even-out the burden of responsibility

# `Status` State Machine
| Status | Payload | Description | Possible Next Status |
|--------|---------|-------------|----------------------|
| `start-req` | `challenger` , `opponent` | Challenger has requested to start a match with Opponent | `start-acc` , `start-rej` |
| `start-acc` | `challenger` , `opponent` | Opponent has accepted the request to start the match | `finish-req` |
| `start-rej` | `challenger` , `opponent` | Opponent has declined the request to start the match | `start-req` |
| `finish-req` | `challenger` , `opponent` , `challenger_score` , `opponent_score` | Challenger has requested Opponent to finish a match with the score | `finish-acc` , `finish-rej` |
| `finish-acc` | `challenger` , `opponent` | Opponent has accepted the request to finish the match | `start-req` | 
| `finish-rej` | `challenger` , `opponent` | Opponent has declined the request to finish the match | `start-req` |
