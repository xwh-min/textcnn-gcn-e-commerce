package inference

import (
	"context"
	"errors"
	"fmt"
)

type CompositePredictor struct {
	primary  Predictor
	fallback Predictor
	strict   bool
}

func NewCompositePredictor(primary, fallback Predictor, strict bool) Predictor {
	return &CompositePredictor{
		primary:  primary,
		fallback: fallback,
		strict:   strict,
	}
}

func (c *CompositePredictor) Backend() string {
	return fmt.Sprintf("%s->%s", c.primary.Backend(), c.fallback.Backend())
}

func (c *CompositePredictor) IsMock() bool {
	return c.primary.IsMock() && c.fallback.IsMock()
}

func (c *CompositePredictor) Health(ctx context.Context) error {
	if err := c.primary.Health(ctx); err == nil {
		return nil
	} else if c.strict {
		return err
	}
	return c.fallback.Health(ctx)
}

func (c *CompositePredictor) Predict(input []float32) ([]float32, error) {
	res, err := c.primary.Predict(input)
	if err == nil {
		return res, nil
	}
	if c.strict {
		return nil, err
	}
	return c.fallback.Predict(input)
}

func (c *CompositePredictor) PredictWithPayload(ctx context.Context, payload InferencePayload) ([]float32, error) {
	res, err := c.primary.PredictWithPayload(ctx, payload)
	if err == nil {
		return res, nil
	}
	if c.strict {
		return nil, err
	}
	return c.fallback.PredictWithPayload(ctx, payload)
}

func (c *CompositePredictor) Close() error {
	var closeErr error
	if c.primary != nil {
		if err := c.primary.Close(); err != nil {
			closeErr = err
		}
	}
	if c.fallback != nil {
		if err := c.fallback.Close(); err != nil {
			if closeErr != nil {
				closeErr = errors.Join(closeErr, err)
			} else {
				closeErr = err
			}
		}
	}
	return closeErr
}
