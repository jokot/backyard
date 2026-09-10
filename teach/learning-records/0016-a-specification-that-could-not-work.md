# A specification that could not work, approved with zero tests

Sunflower wrote `zuma/SPEC.md` and completed the task. Peashooter read
that specification, implemented it, and refused to complete his own task.
He set the status to `blocked` with the reason `review-required`, and he
named the cause in his handoff comment:

> the spec's chain-gap formula physically cannot close gaps (same-speed
> tail), so I added a tail catch-up roll so cascades form

He also named why nobody caught it earlier:

> Parent validated geometry only (tests_run: 0), so this went unnoticed.

## The defect

`SPEC.md` line 50 of draft 1 read:

> every ball advances at `CHAIN_SPEED` = 25 px/s. Per frame, iterate the
> chain front to back and set each ball's
> `s = min(s + CHAIN_SPEED × dt, ballAhead.s − CHAIN_SPACING)`. A ball
> with a gap ahead therefore rolls forward at full speed and stops
> exactly `CHAIN_SPACING` from the ball ahead — this is how gaps close.

The last clause is false. `min` is a clamp against overlap. A clamp never
moves a ball forward. Both balls advance by the same `CHAIN_SPEED × dt`
every frame, so the distance between them never changes, and the `min`
branch never activates.

Verified by running the formula from the specification, unmodified:

```
$ node -e '
const V=25, SP=24, dt=1/60;
let chain=[{s:300},{s:200}];
for(let f=0;f<600;f++){
  chain[0].s+=V*dt;
  chain[1].s=Math.min(chain[1].s+V*dt, chain[0].s-SP);
}
console.log((chain[0].s-chain[1].s).toFixed(2));
'
100.00
```

Ten simulated seconds. The 100 px gap is still exactly 100.00 px.

Acceptance criterion 7 requires that "gaps close as rear balls roll
forward" and that new runs cascade. Under draft 1 no gap ever closes, so
no cascade ever forms. The specification did not make criterion 7 hard.
The specification made criterion 7 impossible.

## The fix

Peashooter added `GAP_CLOSE_MULT` = 3 to the constants. A ball whose gap
ahead is greater than `CHAIN_SPACING + CONTIGUOUS_EPS` advances at three
times `CHAIN_SPEED`, clamped to `CHAIN_SPACING` behind its neighbour.
Touching balls still advance at exactly 25 px/s. See `index.html` lines
254 and 262.

`node test.js` reports `8/8 checks passed`, and check 7 is
"a gap-created run re-contacts and cascades until the chain is stable".

`SPEC.md` line 50 now carries the corrected rule, line 51 states why a
clamp cannot close a gap, and the constants table lists
`GAP_CLOSE_MULT`. The specification and the code now agree.

## What generalizes

**A review that checks shape does not check behaviour.** The
specification task reported `tests_run: 0`. Every number in it was
plausible, every section was present, and the document read as complete.
The one thing nobody did was run it. A formula is code. A specification
that contains a formula can be executed, and 12 lines of `node` are
enough to execute this one.

**Ask what the specification forbids, not what it describes.** Draft 1
described gap closure in a sentence and prevented it in the formula.
Prose and formula contradicted each other, and the prose is the half a
reader believes. When a document states a mechanism and also states an
outcome, check that the mechanism produces the outcome.

**The agent who executes a specification is the first real reviewer.**
Peashooter found this because implementation forces every sentence to
become a behaviour. That is a reason to treat a `review-required` block
as evidence, not as an obstacle. This block was correct and the work
behind it was correct.

## The second defect in the same run

The board held status `blocked` from 14:36. Nothing reported that. Joko
found it by running `hermes kanban show` by hand, 26 minutes later. That
is [[0008-blocked-child-tasks-report-to-nobody]], now recorded twice from
real runs. Lesson 16 found it the first time. It is documented and it is
still not fixed.
