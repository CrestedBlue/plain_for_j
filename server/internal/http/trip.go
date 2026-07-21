package http

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/crestedblue/plan_for_j/server/internal/trip"
)

// registerTripRoutes는 여행묶음/일정 CRUD 라우트를 등록한다.
func (s *Server) registerTripRoutes(api *gin.RouterGroup) {
	t := api.Group("/trips")
	t.GET("", s.listTrips)
	t.POST("", s.createTrip)
	t.GET("/:id", s.getTrip)
	t.PUT("/:id", s.renameTrip)
	t.DELETE("/:id", s.deleteTrip)

	items := t.Group("/:id/days/:date/items")
	items.POST("", s.addItem)
	items.PUT("/:itemId", s.updateItem)
	items.DELETE("/:itemId", s.deleteItem)

	// 순서 변경은 items(/:itemId)와 경로가 겹치지 않도록 형제 경로로 둔다.
	t.PUT("/:id/days/:date/reorder", s.reorderItems)
}

func (s *Server) listTrips(c *gin.Context) {
	trips, err := s.trips.ListTrips(c.Request.Context())
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to list trips")
		return
	}
	ok(c, trips)
}

func (s *Server) createTrip(c *gin.Context) {
	var in trip.CreateTripInput
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}
	t, err := s.trips.CreateTrip(c.Request.Context(), in)
	if err != nil {
		s.respondServiceErr(c, err)
		return
	}
	created(c, t)
}

func (s *Server) getTrip(c *gin.Context) {
	t, err := s.trips.GetTrip(c.Request.Context(), c.Param("id"))
	if err != nil {
		s.respondServiceErr(c, err)
		return
	}
	ok(c, t)
}

func (s *Server) renameTrip(c *gin.Context) {
	var in trip.RenameTripInput
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}
	t, err := s.trips.RenameTrip(c.Request.Context(), c.Param("id"), in.Title)
	if err != nil {
		s.respondServiceErr(c, err)
		return
	}
	ok(c, t)
}

func (s *Server) deleteTrip(c *gin.Context) {
	if err := s.trips.DeleteTrip(c.Request.Context(), c.Param("id")); err != nil {
		s.respondServiceErr(c, err)
		return
	}
	ok(c, gin.H{"deleted": true})
}

func (s *Server) addItem(c *gin.Context) {
	var in trip.ItemInput
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}
	item, err := s.trips.AddItem(c.Request.Context(), c.Param("id"), c.Param("date"), in)
	if err != nil {
		s.respondServiceErr(c, err)
		return
	}
	created(c, item)
}

func (s *Server) updateItem(c *gin.Context) {
	var in trip.ItemInput
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}
	item, err := s.trips.UpdateItem(c.Request.Context(), c.Param("id"), c.Param("date"), c.Param("itemId"), in)
	if err != nil {
		s.respondServiceErr(c, err)
		return
	}
	ok(c, item)
}

func (s *Server) deleteItem(c *gin.Context) {
	if err := s.trips.DeleteItem(c.Request.Context(), c.Param("itemId")); err != nil {
		s.respondServiceErr(c, err)
		return
	}
	ok(c, gin.H{"deleted": true})
}

func (s *Server) reorderItems(c *gin.Context) {
	var in trip.ReorderInput
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}
	t, err := s.trips.ReorderItems(c.Request.Context(), c.Param("id"), c.Param("date"), in.OrderedIDs)
	if err != nil {
		s.respondServiceErr(c, err)
		return
	}
	ok(c, t)
}

// respondServiceErr는 서비스 에러를 적절한 HTTP 상태로 매핑한다.
func (s *Server) respondServiceErr(c *gin.Context, err error) {
	if errors.Is(err, trip.ErrNotFound) {
		fail(c, http.StatusNotFound, "not found")
		return
	}
	if errors.Is(err, trip.ErrInvalidInput) {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}
	fail(c, http.StatusInternalServerError, err.Error())
}
