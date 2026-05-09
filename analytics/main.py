"""CreditKit analytics microservice — credit and project finance metrics."""

from typing import Literal, Union

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, ValidationError

app = FastAPI(title="CreditKit Analytics", version="0.1.0")


class CorporateIn(BaseModel):
    kind: Literal["corporate"] = "corporate"
    ebitdaTtm: float
    totalDebt: float
    interestExpenseTtm: float
    cash: float
    revenueTtm: float


class InfraIn(BaseModel):
    kind: Literal["infrastructure"] = "infrastructure"
    noiTtm: float
    debtServiceTtm: float
    cash: float


class MetricsOut(BaseModel):
    debtToEbitda: float | None
    interestCoverage: float | None
    dscr: float | None
    probabilityOfDefaultPct: float
    recoveryRatePct: float


@app.get("/health")
def health():
    return {"status": "ok"}


def _compute(body: Union[CorporateIn, InfraIn]) -> MetricsOut:
    if isinstance(body, CorporateIn):
        dte = body.totalDebt / body.ebitdaTtm if body.ebitdaTtm > 0 else None
        ic = (
            (body.ebitdaTtm * 0.85) / body.interestExpenseTtm
            if body.interestExpenseTtm > 0
            else None
        )
        lev_score = min(99.0, max(1.0, (dte or 5.0) * 12.0))
        recovery = max(25.0, 100.0 - (dte or 5.0) * 8.0)
        return MetricsOut(
            debtToEbitda=round(dte, 3) if dte is not None else None,
            interestCoverage=round(ic, 3) if ic is not None else None,
            dscr=None,
            probabilityOfDefaultPct=round(lev_score, 2),
            recoveryRatePct=round(recovery, 2),
        )

    dscr = body.noiTtm / body.debtServiceTtm if body.debtServiceTtm > 0 else None
    return MetricsOut(
        debtToEbitda=None,
        interestCoverage=None,
        dscr=round(dscr, 3) if dscr is not None else None,
        probabilityOfDefaultPct=round(
            min(40.0, max(2.0, 45.0 / max(dscr or 1.0, 0.1))), 2
        ),
        recoveryRatePct=55.0,
    )


@app.post("/metrics", response_model=MetricsOut)
async def metrics(request: Request):
    data = await request.json()
    kind = data.get("kind")
    try:
        if kind == "corporate":
            body = CorporateIn.model_validate(data)
        elif kind == "infrastructure":
            body = InfraIn.model_validate(data)
        else:
            raise HTTPException(status_code=422, detail="kind must be corporate or infrastructure")
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e
    return _compute(body)
